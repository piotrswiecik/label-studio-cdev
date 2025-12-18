import {ProjectContext, useProject} from "../../../providers/ProjectProvider";
import {createTitleFromSegments, useAPI, useUpdatePageTitle} from "@humansignal/core";
import {useContext, useState} from "react";
import {cn} from "../../../utils/bem";

export const ProjectTagSettings = () => {
  const { project, fetchProject } = useContext(ProjectContext);
  const api = useAPI();
  const [processing, setProcessing] = useState(null);

  useUpdatePageTitle(createTitleFromSegments([project?.title, "Project Tags"]));

  const tags = project.project_tags;

  return (
  <div>
    <div>
      <h1>Project Tags</h1>
      <div className={cn("project-tag-settings").elem("tag-list").toClassName()}>
        {project.project_tags && project.project_tags.map((tag) => (
          <div
            className={cn("project-tag-settings").elem("tag-row").toClassName()}
            key={tag}
          >
            <div className={cn("project-tag-settings").elem("tag").toClassName()}>
              {tag}
            </div>
            <button className={cn("project-tag-settings").elem("tag-delete").toClassName()}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);
}

ProjectTagSettings.menuItem = "Tags";
ProjectTagSettings.path = "/project-tags";
ProjectTagSettings.exact = true;
