import { Detail, List } from "@raycast/api";
import path, { dirname } from "path";
import fs from "fs";
import { format } from "timeago.js";
import { IReactProjectMTime } from "./types";

// nice Things I need to do:

// [x] 1. List the content of the directory `React`
// [x] 2. Sort the content based on the last updated time
// [] 3. Now check in those projects, whether jsx/tsx file is updated
// [] 4. If yes then record that time
// [] 5. Current time - that time === TimeSinceYouLastWroteReact

const REACT_BASE_DIR = "/Users/pranjal.dev/coding/React/";

const isValidDir = (dir: fs.Dirent) => {
  const blackListedDir = ["node_modules", "public", "build", "dist", "coverage"];
  return !(dir.name.length === 0 || dir.name.startsWith(".") || blackListedDir.includes(dir.name));
};

const getRecentUpdatedTime = (
  projectPath: string
): {
  mtimems: number;
  mtime: Date;
  dirname: string;
} | null => {
  const projectDirectoriesQueue = [projectPath];
  const mostRecentUpdate = {
    mtimems: 0,
    mtime: new Date(),
    dirname: "",
  };
  let isFirstRun = true;
  while (projectDirectoriesQueue.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const dirname = projectDirectoriesQueue.shift()!;
    const dirent = fs.readdirSync(dirname, { withFileTypes: true });

    const validDirent = dirent.filter((dir) => dir.isDirectory() && isValidDir(dir));
    if (validDirent.length === 0 && isFirstRun) {
      return null;
    }

    isFirstRun = false;
    validDirent
      .map((dir) => path.join(dirname, dir.name))
      .forEach((dir) => {
        const dirStats = fs.statSync(dir);
        if (Math.round(dirStats.mtimeMs) > Math.round(mostRecentUpdate.mtimems)) {
          mostRecentUpdate.mtimems = dirStats.mtimeMs;
          mostRecentUpdate.mtime = dirStats.mtime;
          mostRecentUpdate.dirname = path.basename(dir);
        }
        projectDirectoriesQueue.push(dir);
      });
  }

  return mostRecentUpdate;
};

const listReactProjectWithMtime = (basePath: string): Array<IReactProjectMTime> => {
  const dirent = fs.readdirSync(basePath, { withFileTypes: true });
  const reactProjects = dirent
    .filter((dir) => dir.isDirectory() && isValidDir(dir))
    .map((dir) => {
      const dirTimeStats = getRecentUpdatedTime(path.join(basePath, dir.name));
      if (dirTimeStats === null) return null;
      return {
        name: dir.name,
        mtimems: dirTimeStats.mtimems,
        mtime: dirTimeStats.mtime,
        dirname: dirTimeStats.dirname,
      };
    });

  const filteredProjects = reactProjects.filter((project) => project !== null) as IReactProjectMTime[];
  return filteredProjects;
};

const sortProjectsByLastModifiedTime = (projectA: IReactProjectMTime, projectB: IReactProjectMTime) => {
  return projectB.mtimems - projectA.mtimems;
};

const daysSinceWrittenReact = (project: IReactProjectMTime) => {
  const currentDate = new Date().getTime();
  const projectDate = new Date(project.mtime).getTime();
  return Math.round(Math.abs(currentDate - projectDate) / (1000 * 60 * 60 * 24)) + " days";
};

const localDateAndTimeOfProject = (project: IReactProjectMTime) => {
  return new Date(project.mtime).toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
};

export default function Command() {
  const projectsWithMetadata = listReactProjectWithMtime(REACT_BASE_DIR);
  projectsWithMetadata.sort(sortProjectsByLastModifiedTime);
  // console.log("All the projects: ", JSON.stringify(projectsWithMetadata, null, 2));
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
          detail={
            <List.Item.Detail
              markdown={`**Last modified: ${daysSinceWrittenReact(project)}**`}
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label title="Date and Time" text={localDateAndTimeOfProject(project)} />
                </List.Item.Detail.Metadata>
              }
            />
          }
        />
      ))}
    </List>
  );
}
