import { Detail, List } from "@raycast/api";
import path from "path";
import fs from "fs";
import { format } from "timeago.js";
import { IReactProjectMTime } from "./types";

// Things I need to do:

// [x] 1. List the content of the directory `React`
// [x] 2. Sort the content based on the last updated time
// [] 3. Now check in those projects, whether jsx/tsx file is updated
// [] 4. If yes then record that time
// [] 5. Current time - that time === TimeSinceYouLastWroteReact

const REACT_BASE_DIR = "/Users/pranjal.dev/coding/React/";

const isValidDir = (dir: fs.Dirent) => {
  const blackListedDir = [".git", ".github", ".vscode", "node_modules", "public"];
  return !blackListedDir.includes(dir.name);
};

const getRecentUpdatedTime = (projectPath: string) => {
  console.log("project path = ", projectPath);
  const projectDirectoriesQueue = [projectPath];
  const mostRecentUpdate = {
    mtimems: 0,
    mtime: new Date(),
  };
  while (projectDirectoriesQueue.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const dirname = projectDirectoriesQueue.shift()!;
    const dirent = fs.readdirSync(dirname, { withFileTypes: true });
    dirent
      .filter((dir) => dir.isDirectory() && isValidDir(dir))
      .map((dir) => path.join(dirname, dir.name))
      .forEach((dir) => {
        const dirStats = fs.statSync(dir);
        if (dirStats.mtimeMs > mostRecentUpdate.mtimems) {
          mostRecentUpdate.mtimems = dirStats.mtimeMs;
          mostRecentUpdate.mtime = dirStats.mtime;
        }
        projectDirectoriesQueue.push(dir);
      });
  }

  return mostRecentUpdate;
};

const listReactProjectWithMtime = (basePath: string): Array<IReactProjectMTime> => {
  const dirent = fs.readdirSync(basePath, { withFileTypes: true });
  const reactProjects = dirent
    .filter((dir) => dir.isDirectory())
    .map((dir) => {
      const dirTimeStats = getRecentUpdatedTime(path.join(basePath, dir.name));
      console.log("Details: ", {
        name: dir.name,
        mtimems: dirTimeStats.mtimems,
        mtime: dirTimeStats.mtime,
      });
      return {
        name: dir.name,
        mtimems: dirTimeStats.mtimems,
        mtime: dirTimeStats.mtime,
      };
    });

  return reactProjects;
};

const sortProjectsByLastModifiedTime = (projectA: IReactProjectMTime, projectB: IReactProjectMTime) => {
  return projectB.mtimems - projectA.mtimems;
};

const computeTimeSpentSinceWrittenReact = (project: IReactProjectMTime) => {
  const currentDate = new Date().getTime();
  const projectDate = new Date(project.mtime).getTime();
  return Math.round(Math.abs(currentDate - projectDate) / (1000 * 60 * 60 * 24)) + " days";
};

export default function Command() {
  console.log("Basename for dir: ", path.basename(__dirname));
  const projectsWithMetadata = listReactProjectWithMtime(REACT_BASE_DIR);
  projectsWithMetadata.sort(sortProjectsByLastModifiedTime);
  return (
    <List
      isShowingDetail
      navigationTitle="React Projects"
      searchBarPlaceholder={`Search from your ${projectsWithMetadata.length} awesome react project`}
    >
      {projectsWithMetadata.map((project, idx) => (
        <List.Item
          key={idx}
          title={project.name}
          detail={<List.Item.Detail markdown={`**Last modified: ${computeTimeSpentSinceWrittenReact(project)}**`} />}
        />
      ))}
    </List>
  );
}
