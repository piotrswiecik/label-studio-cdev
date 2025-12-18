import {ProjectContext, useProject} from "../../../providers/ProjectProvider";
import {ApiContext, createTitleFromSegments, useAPI, useUpdatePageTitle} from "@humansignal/core";
import React, {useCallback, useContext, useState} from "react";
import {cn} from "../../../utils/bem";
import { Form, Input, TextArea } from "../../../components/Form";
import {Button} from "@humansignal/ui";

export const ProjectTagSettings = () => {
  const { project, fetchProject } = useContext(ProjectContext);
  const [newTag, setNewTag] = useState("");

  const refreshProject = useCallback(() => {
    if (project.id) fetchProject(project.id, true);
  }, [project.id, fetchProject]);

  useUpdatePageTitle(createTitleFromSegments([project?.title, "Project Tags"]));

  // Bypassing the abstractions, just make a direct call FFS...
  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    const response = await fetch(`/api/projects/${project.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: newTag }),
    });

    if (response.ok) {
      setNewTag("");
      refreshProject();
    }
  };

  const handleDeleteTag = async (tag) => {
    const response = await fetch(`/api/projects/${project.id}/tags/${encodeURIComponent(tag)}`, {
      method: "DELETE",
    });

    if (response.ok) {
      refreshProject();
    }
  };

  return (
    <div>
      <div>
        <h1>Project Tags</h1>
        <div className={cn("project-tag-settings").elem("tag-list").toClassName()}>
          {project.project_tags?.map((tag) => (
            <div
              className={cn("project-tag-settings").elem("tag-row").toClassName()}
              key={tag}
            >
              <div className={cn("project-tag-settings").elem("tag").toClassName()}>
                {tag}
              </div>
              <button
                className={cn("project-tag-settings").elem("tag-delete").toClassName()}
                onClick={() => handleDeleteTag(tag)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddTag}>
          <Input
            name="tag"
            label="Add New Tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <Button type="submit" className="w-[150px]">
            Add Tag
          </Button>
        </form>
      </div>
    </div>
  );
}

ProjectTagSettings.menuItem = "Tags";
ProjectTagSettings.path = "/project-tags";
ProjectTagSettings.exact = true;
