import { List } from "@raycast/api";
import path from "path";
import fs from "fs";
import { IReactProjectMTime } from "./types";

// Things I need to do:

// [x] 1. List the content of the directory `React`
// [x] 2. Sort the content based on the last updated time
// [] 3. Now check in those projects, whether jsx/tsx file is updated
// [] 4. If yes then record that time
// [] 5. Current time - that time === TimeSinceYouLastWroteReact

const REACT_BASE_DIR = "/Users/pranjal.dev/coding/React/";

const listReactProjectWithMtime = (basePath: string): Array<IReactProjectMTime> => {
  const dirent = fs.readdirSync(basePath, { withFileTypes: true });
  const reactProjects = dirent
    .filter((dir) => dir.isDirectory())
    .map((dir) => ({
      name: dir.name,
      mtime: fs.statSync(path.join(basePath, dir.name)).mtimeMs,
    }));

  return reactProjects;
};

const sortProjectsByLastModifiedTime = (projectA: IReactProjectMTime, projectB: IReactProjectMTime) => {
  return projectB.mtime - projectA.mtime;
};

export default function Command() {
  console.log("Basename for dir: ", path.basename(__dirname));
  const projectsWithMetadata = listReactProjectWithMtime(REACT_BASE_DIR);
  projectsWithMetadata.sort(sortProjectsByLastModifiedTime);
  return (
    <List
      navigationTitle="React Projects"
      searchBarPlaceholder={`Search from your ${projectsWithMetadata.length} awesome react project`}
    >
      {projectsWithMetadata.map((project, idx) => (
        <List.Item key={idx} title={project.name} />
      ))}
    </List>
  );
}
