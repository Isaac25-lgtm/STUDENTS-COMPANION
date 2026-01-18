import type { CourseworkProject } from '../types/coursework';

const STORAGE_KEY = 'coursework_projects';

export function saveProject(project: CourseworkProject): void {
  try {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    
    const updatedProject = { ...project, lastUpdated: Date.now() };
    
    if (index >= 0) {
      projects[index] = updatedProject;
    } else {
      projects.push(updatedProject);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving coursework project:', error);
  }
}

export function getProjects(): CourseworkProject[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getProject(id: string): CourseworkProject | null {
  const projects = getProjects();
  return projects.find(p => p.id === id) || null;
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getRecentProjects(limit: number = 5): CourseworkProject[] {
  return getProjects()
    .sort((a, b) => b.lastUpdated - a.lastUpdated)
    .slice(0, limit);
}


