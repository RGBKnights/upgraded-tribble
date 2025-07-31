import { Build } from '../types/Block';

const STORAGE_KEY = 'minecraft_builds';

export const saveBuild = (build: Build): void => {
  try {
    const builds = loadBuilds();
    const existingIndex = builds.findIndex(b => b.id === build.id);
    
    if (existingIndex >= 0) {
      builds[existingIndex] = build;
    } else {
      builds.push(build);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
  } catch (error) {
    console.error('Failed to save build:', error);
    throw new Error('Failed to save build to local storage');
  }
};

export const loadBuilds = (): Build[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load builds:', error);
    return [];
  }
};

export const deleteBuild = (buildId: string): void => {
  try {
    const builds = loadBuilds();
    const filtered = builds.filter(b => b.id !== buildId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete build:', error);
    throw new Error('Failed to delete build from local storage');
  }
};

export const exportBuildAsJson = (build: Build): Blob => {
  const jsonString = JSON.stringify(build, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
};

export const downloadBuildJson = (build: Build): void => {
  const blob = exportBuildAsJson(build);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${build.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};