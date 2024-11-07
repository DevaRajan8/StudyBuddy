from dotenv import find_dotenv, load_dotenv
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from langchain_community.tools import DuckDuckGoSearchRun

from .tools import *

import os
os.environ["OTEL_SDK_DISABLED"] = "true"
# set CREWAI_TELEMETRY_OPT_OUT=True
__all__ = ['backendcrewCrew']

load_dotenv(find_dotenv())


@CrewBase
class backendcrewCrew:
    """Backendcrew crew setup"""
    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'

    def __init__(self) -> None:
        # Initialize the LLM with specific settings
        self.manager_llm = "groq/llama-3.2-90b-text-preview"
        self.llm = "groq/llama-3.2-90b-text-preview"
        # self.llm = "groq/llama3-groq-70b-8192-tool-use-preview"
        self.function_calling_llm = "groq/llama-3.2-90b-text-preview"
        self.cached_crew = None

    @agent
    def notebook_resource_manager(self) -> Agent:
        return Agent(
            config=self.agents_config['notebook_resource_manager'],
            llm=self.llm,
            verbose=True
        )

    @agent
    def schedule_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['schedule_agent'],
            tools=[CustomCalenderTool()],
            llm=self.llm,
            verbose=True
        )

    @agent
    def performance_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config['performance_analyst'],
            llm=self.llm,
            verbose=True
        )

    @agent
    def misc_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['misc_agent'],
            tools=[DuckDuckGoSearchRun()],  # Web search tool for handling general queries
            llm=self.llm,
            verbose=True
        )

    @agent
    def task_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['task_agent'],
            tools=[AddTaskTool(), QueryTasksTool(), UpdateTaskTool(), DeleteTaskTool(),GetAllTasksTool()],
            llm=self.llm,
            verbose=True
        )

    @agent
    def query_clarification_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['query_clarification_agent'],
            llm=self.llm,
            verbose=True
        )

    def manager_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['manager_agent'],
            llm=self.manager_llm,
            verbose=True
        )

    @task
    def route_query(self) -> Task:
        return Task(
            config=self.tasks_config['route_query_task'],
        )
    
    @task
    def select_agent(self) -> Task:
        return Task(
            config=self.tasks_config['select_agent_task'],
        )

    @task
    def organize_resources(self) -> Task:
        return Task(
            config=self.tasks_config['organize_resources_task'],
        )

    @task
    def create_study_schedule(self) -> Task:
        return Task(
            config=self.tasks_config['create_study_schedule_task'],
        )

    @task
    def analyze_performance(self) -> Task:
        return Task(
            config=self.tasks_config['analyze_performance_task'],
        )

    @task
    def handle_misc_queries(self) -> Task:
        return Task(
            config=self.tasks_config['miscellaneous_task_handling'],
        )

    @task
    def manage_tasks(self) -> Task:
        return Task(
            config=self.tasks_config['manage_task'],
        )
    
    @task
    def clarify_query_task(self) -> Task:
        return Task(
            config=self.tasks_config['clarify_query_task'],
        )

    @crew
    def crew(self) -> Crew:
        """Gets or creates the StudyTracker crew singleton"""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.hierarchical,
            manager_agent=self.manager_agent(),
            manager_llm=self.llm,
            verbose=False,
            max_rpm=30,
            cache=False,
            share_crew=False,
            function_calling_llm=self.function_calling_llm,
            output_log_file="debugLogs/crewai_inbuild.log",
            memory=True,
            embedder={
                "provider": "google",
                "config": {
                    "model": "text-embedding-004"  
                }
            }
        )
        
    
    def process_query(self, query: str) -> str:
        if not self.cached_crew:
            self.cached_crew = self.crew()
        crew = self.cached_crew

        valid_agents = list(self.agents_config.keys())
        max_retries = 10
        retry_count = 0
        selected_agent_name = None

        # Retry loop for agent selection
        while retry_count < max_retries:
            selected_agent_name = crew.manager_agent.execute_task(
                self.select_agent(), 
                context={
                    'query': query,
                    'invalid_count': retry_count
                }
            )
            
            # Clean up selected agent name
            if selected_agent_name:
                selected_agent_name = selected_agent_name.strip().strip('"\'').lower()
            
            # Check if valid agent was selected
            if selected_agent_name in valid_agents:
                break
                
            print(f"Attempt {retry_count + 1}: Invalid agent selection '{selected_agent_name}'")
            retry_count += 1

        # If no valid agent was selected after all retries
        if retry_count >= max_retries or selected_agent_name not in valid_agents:
            print(f"Failed to select valid agent after {max_retries} attempts. Defaulting to misc_agent")
            selected_agent_name = 'misc_agent'

        selected_agent_with_role = self.agents_config[selected_agent_name]['role']
        response = None
        agent_task = None

        # Find matching agent and task
        for agent in crew.agents:
            if agent.role == selected_agent_with_role:
                for task in self.tasks_config.values():
                    if getattr(task.get('agent', 'found_none'), 'role', {}) == selected_agent_with_role:
                        agent_task = [i for i in crew.tasks if i.description==task['description']][0]
                        break
                if agent_task:
                    response = agent.execute_task(agent_task, context={'query': query})
                break

        return response if response else f"No response from {selected_agent_name}. The query may need to be reformulated."


if __name__ == '__main__':
    crew = backendcrewCrew()
    response = crew.process_query("Pending Tasks?")
    print(f"\n\n{response=}")