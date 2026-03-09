import chr from "chroma-js";
import { format } from "date-fns";
import {useCallback, useMemo, useState} from "react";
import { NavLink, useHistory } from "react-router-dom";
import { IconCheck, IconEllipsis, IconMinus, IconSparks } from "@humansignal/icons";
import { Userpic, Button, Dropdown, Tooltip } from "@humansignal/ui";
import { Menu, Pagination } from "../../components";
import { cn } from "../../utils/bem";
import { absoluteURL } from "../../utils/helpers";
import { ProjectStateChip } from "@humansignal/app-common";
import { modal } from "../../components/Modal/Modal";
import { useModalControls } from "../../components/Modal/ModalPopup";
import Input from "../../components/Form/Elements/Input/Input";
import { Space } from "../../components/Space/Space";
import { useAPI } from "../../providers/ApiProvider";


const DEFAULT_CARD_COLORS = ["#FFFFFF", "#FDFDFC"];

const TagFilterBar = ({ allTags, selectedTags, onTagToggle, onClearAll }) => {
  if (allTags.length === 0) return null;

  return (
    <div className={cn("projects-page").elem("tag-filter").toClassName()}>
      <span className={cn("projects-page").elem("tag-filter-label").toClassName()}>
        Filter by tags:
      </span>
      <div className={cn("projects-page").elem("tag-filter-list").toClassName()}>
        {allTags.map((tag) => (
          <button
            key={tag}
            className={cn("projects-page")
              .elem("tag-filter-item")
              .mod({ active: selectedTags.includes(tag) })
              .toClassName()}
            onClick={() => onTagToggle(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      {selectedTags.length > 0 && (
        <button
          className={cn("projects-page").elem("tag-filter-clear").toClassName()}
          onClick={onClearAll}
        >
          Clear all
        </button>
      )}
    </div>
  );
};

const DuplicateModalContent = ({ defaultTitle, defaultDescription, onDuplicate }) => {
  const ctrl = useModalControls();
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [mode, setMode] = useState("settings");
  const [includeAnnotations, setIncludeAnnotations] = useState(false);
  const [includePredictions, setIncludePredictions] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onDuplicate({
        title,
        description,
        mode,
        include_annotations: mode === "settings,data" ? includeAnnotations : false,
        include_predictions: mode === "settings,data" ? includePredictions : false,
      });
      ctrl?.hide();
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <div>
      <Input
        label="Project title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <div style={{ marginTop: 12 }}>
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 14 }}>
          What to duplicate
        </label>
        <label style={{ display: "block", cursor: "pointer", marginBottom: 4 }}>
          <input
            type="radio"
            name="duplicate-mode"
            value="settings"
            checked={mode === "settings"}
            onChange={() => setMode("settings")}
          />{" "}
          Settings only
        </label>
        <label style={{ display: "block", cursor: "pointer" }}>
          <input
            type="radio"
            name="duplicate-mode"
            value="settings,data"
            checked={mode === "settings,data"}
            onChange={() => setMode("settings,data")}
          />{" "}
          Settings and tasks
        </label>
      </div>
      {mode === "settings,data" && (
        <div style={{ marginTop: 12, paddingLeft: 4 }}>
          <label style={{ display: "block", cursor: "pointer", marginBottom: 4 }}>
            <input
              type="checkbox"
              checked={includeAnnotations}
              onChange={(e) => setIncludeAnnotations(e.target.checked)}
            />{" "}
            Include annotations
          </label>
          <label style={{ display: "block", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={includePredictions}
              onChange={(e) => setIncludePredictions(e.target.checked)}
            />{" "}
            Include predictions
          </label>
        </div>
      )}
      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
        <Space align="end">
          <Button
            variant="neutral"
            look="outline"
            onClick={() => ctrl?.hide()}
          >
            Cancel
          </Button>
          <Button
            disabled={loading}
            waiting={loading}
            onClick={handleSubmit}
          >
            Duplicate
          </Button>
        </Space>
      </div>
    </div>
  );
};

export const ProjectsList = ({ projects, currentPage, totalItems, loadNextPage, pageSize, onRefresh }) => {
  const [selectedTags, setSelectedTags] = useState([]);

  const allTags = useMemo(() => {
    const tags = new Set();
    projects.forEach((project) => {
      project.project_tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (selectedTags.length === 0) return projects;
    return projects.filter((project) =>
      selectedTags.every((tag) => project.project_tags?.includes(tag))
    );
  }, [projects, selectedTags]);

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearAll = () => {
    setSelectedTags([]);
  };

  return (
    <>
      <TagFilterBar
        allTags={allTags}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        onClearAll={handleClearAll}
      />
      <div className={cn("projects-page").elem("list").toClassName()}>
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} onRefresh={onRefresh} />
        ))}
      </div>
      <div className={cn("projects-page").elem("pages").toClassName()}>
        <Pagination
          name="projects-list"
          label="Projects"
          page={currentPage}
          totalItems={totalItems}
          urlParamName="page"
          pageSize={pageSize}
          pageSizeOptions={[10, 30, 50, 100]}
          onPageLoad={(page, pageSize) => loadNextPage(page, pageSize)}
        />
      </div>
    </>
  );
};

export const EmptyProjectsList = ({ openModal }) => {
  return (
    <div className={cn("empty-projects-page").toClassName()}>
      <img
        alt="Heidi looking for projects"
        className={cn("empty-projects-page").elem("heidi").toClassName()}
        src={absoluteURL("/static/images/opossum_looking.png")}
      />
      <h1 className={cn("empty-projects-page").elem("header").toClassName()}>Heidi doesn't see any projects here!</h1>
      <p>Create one and start labeling your data.</p>
      <Button onClick={openModal} className="my-8" aria-label="Create new project">
        Create Project
      </Button>
    </div>
  );
};

const ProjectCard = ({ project, onTagClick, onRefresh }) => {
  const api = useAPI();
  const history = useHistory();

  const color = useMemo(() => {
    return DEFAULT_CARD_COLORS.includes(project.color) ? null : project.color;
  }, [project]);

  const projectColors = useMemo(() => {
    const textColor =
      color && chr(color).luminance() > 0.3
        ? "var(--color-neutral-inverted-content)"
        : "var(--color-neutral-inverted-content)"; // Determine text color based on luminance
    return color
      ? {
          "--header-color": color,
          "--background-color": chr(color).alpha(0.2).css(),
          "--text-color": textColor,
          "--border-color": chr(color).alpha(0.5).css(),
        }
      : {};
  }, [color]);

  const handleDuplicate = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();

    const defaultTitle = `Copy of ${project.title || "New project"}`;
    const defaultDescription = project.description || "";

    modal({
      title: "Duplicate Project",
      width: 500,
      allowClose: true,
      body: () => (
        <DuplicateModalContent
          defaultTitle={defaultTitle}
          defaultDescription={defaultDescription}
          onDuplicate={async ({ title, description, mode, include_annotations, include_predictions }) => {
            const result = await api.callApi("duplicateProject", {
              params: { pk: project.id },
              body: { title, description, mode, include_annotations, include_predictions },
            });
            if (result?.id) {
              history.push(`/projects/${result.id}/data`);
            } else if (onRefresh) {
              onRefresh();
            }
          }}
        />
      ),
    });
  }, [project, api, history, onRefresh]);

  return (
    <NavLink
      className={cn("projects-page").elem("link").toClassName()}
      to={`/projects/${project.id}/data`}
      data-external
    >
      <div className={cn("project-card").mod({ colored: !!color }).toClassName()} style={projectColors}>
        <div className={cn("project-card").elem("header").toClassName()}>
          <div className={cn("project-card").elem("title").toClassName()}>
            <div className={cn("project-card").elem("title-text-wrapper").toClassName()}>
              <Tooltip title={project.title ?? "New project"}>
                <div className={cn("project-card").elem("title-text").toClassName()}>
                  {project.title ?? "New project"}
                </div>
              </Tooltip>
            </div>

            <div
              className={cn("project-card").elem("menu").toClassName()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <Dropdown.Trigger
                content={
                  <Menu contextual>
                    <Menu.Item href={`/projects/${project.id}/settings`}>Settings</Menu.Item>
                    <Menu.Item href={`/projects/${project.id}/data?labeling=1`}>Label</Menu.Item>
                    <Menu.Item onClick={handleDuplicate}>Duplicate</Menu.Item>
                  </Menu>
                }
              >
                <Button size="smaller" look="string" aria-label="Project options">
                  <IconEllipsis />
                </Button>
              </Dropdown.Trigger>
            </div>

            {project.state && (
              <div className={cn("project-card").elem("state-chip").toClassName()}>
                <ProjectStateChip state={project.state} projectId={project.id} interactive={false} />
              </div>
            )}
          </div>
          <div className={cn("project-card").elem("summary").toClassName()}>
            <div className={cn("project-card").elem("annotation").toClassName()}>
              <div className={cn("project-card").elem("total").toClassName()}>
                {project.finished_task_number} / {project.task_number}
              </div>
              <div className={cn("project-card").elem("detail").toClassName()}>
                <div className={cn("project-card").elem("detail-item").mod({ type: "completed" }).toClassName()}>
                  <IconCheck className={cn("project-card").elem("icon").toClassName()} />
                  {project.total_annotations_number}
                </div>
                <div className={cn("project-card").elem("detail-item").mod({ type: "rejected" }).toClassName()}>
                  <IconMinus className={cn("project-card").elem("icon").toClassName()} />
                  {project.skipped_annotations_number}
                </div>
                <div className={cn("project-card").elem("detail-item").mod({ type: "predictions" }).toClassName()}>
                  <IconSparks className={cn("project-card").elem("icon").toClassName()} />
                  {project.total_predictions_number}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={cn("project-card").elem("description").toClassName()}>{project.description}</div>
        <div className={cn("project-card").elem("tags").toClassName()}>
          {/* CHANGED: Made tags clickable */}
          {project.project_tags && project.project_tags.map((tag) => (
            <button
              className={cn("project-card").elem("tag").toClassName()}
              key={tag}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onTagClick?.(tag);
              }}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className={cn("project-card").elem("info").toClassName()}>
          <div className={cn("project-card").elem("created-date").toClassName()}>
            {format(new Date(project.created_at), "dd MMM 'yy, HH:mm")}
          </div>
          <div className={cn("project-card").elem("created-by").toClassName()}>
            <Userpic src="#" user={project.created_by} showUsernameTooltip />
          </div>
        </div>
      </div>
    </NavLink>
  );
};
