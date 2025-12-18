import {ProjectContext, useProject} from "../../../providers/ProjectProvider";
import {createTitleFromSegments, useAPI, useUpdatePageTitle} from "@humansignal/core";
import {useCallback, useContext, useState} from "react";
import {cn} from "../../../utils/bem";
import { Form, Input, TextArea } from "../../../components/Form";
import {Button} from "@humansignal/ui";

export const ProjectTagSettings = () => {
  const { project, fetchProject } = useContext(ProjectContext);
  const api = useAPI();
  const [processing, setProcessing] = useState(null);

  useUpdatePageTitle(createTitleFromSegments([project?.title, "Project Tags"]));

  const addTag = useCallback(() => {
  }, []);

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
      <Form action="addTag" formData={{ ...project }} params={{ pk: project.id }} onSubmit={addTag}>
        <Form.Row columnCount={1} rowGap="16px">
              <Input name="tag" label="Add New Tag" />
        </Form.Row>
        <Form.Actions>
          <Form.Indicator>
            <span case="success">Saved!</span>
          </Form.Indicator>
          <Button type="submit" className="w-[150px]" aria-label="Save Tag">
            Save
          </Button>
        </Form.Actions>
      </Form>
    </div>
  </div>
);
}

ProjectTagSettings.menuItem = "Tags";
ProjectTagSettings.path = "/project-tags";
ProjectTagSettings.exact = true;
