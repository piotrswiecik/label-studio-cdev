import { inject, observer } from "mobx-react";
import { type FC, useEffect, useState } from "react";
import { cn } from "../../../utils/bem";
import { Comments as CommentsComponent } from "../../Comments/Comments";
import { AnnotationHistory } from "../../CurrentEntity/AnnotationHistory";
import { PanelBase, type PanelProps } from "../PanelBase";
import "./DetailsPanel.scss";
import { RegionDetailsMain, RegionDetailsMeta } from "./RegionDetails";
import { RegionItem } from "./RegionItem";
import { Relations as RelationsComponent } from "./Relations";
// eslint-disable-next-line
// @ts-ignore
import { RelationsControls } from "./RelationsControls";
import { EmptyState } from "../Components/EmptyState";
import { IconCursor, IconRelationLink } from "@humansignal/icons";
import { getDocsUrl } from "../../../utils/docs";

interface DetailsPanelProps extends PanelProps {
  regions: any;
  selection: any;
}

const DetailsPanelComponent: FC<DetailsPanelProps> = ({ currentEntity, regions, ...props }) => {
  const selectedRegions = regions.selection;

  return (
    <PanelBase {...props} currentEntity={currentEntity} name="details" title="Details">
      <Content selection={selectedRegions} currentEntity={currentEntity} />
    </PanelBase>
  );
};

const DetailsComponent: FC<DetailsPanelProps> = ({ currentEntity, regions }) => {
  const selectedRegions = regions.selection;

  return (
    <div className={cn("details-tab").toClassName()}>
      <Content selection={selectedRegions} currentEntity={currentEntity} />
    </div>
  );
};

const Content: FC<any> = observer(function Content({ selection, currentEntity }: any): JSX.Element {
  return <>{selection.size ? <RegionsPanel regions={selection} /> : <GeneralPanel currentEntity={currentEntity} />}</>;
});

const CommentsTab: FC<any> = inject("store")(
  observer(function CommentsTab({ store }: any): JSX.Element {
    return (
      <>
        {store.hasInterface("annotations:comments") && store.commentStore.isCommentable && (
          <div className={cn("comments-panel").toClassName()}>
            <div className={cn("comments-panel").elem("section-tab").toClassName()}>
              <div className={cn("comments-panel").elem("section-content").toClassName()}>
                <CommentsComponent
                  annotationStore={store.annotationStore}
                  commentStore={store.commentStore}
                  cacheKey={`task.${store.task.id}`}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }),
);

const RelationsTab: FC<any> = inject("store")(
  observer(function RelationsTab({ currentEntity }: any): JSX.Element {
    const { relationStore } = currentEntity;
    const hasRelations = relationStore.size > 0;

    return (
      <>
        <div className={cn("relations").toClassName()}>
          <div className={cn("relations").elem("section-tab").toClassName()}>
            {hasRelations ? (
              <>
                <div className={cn("relations").elem("view-control").toClassName()}>
                  <div className={cn("relations").elem("section-head").toClassName()}>
                    Relations ({relationStore.size})
                  </div>
                  <RelationsControls relationStore={relationStore} />
                </div>
                <div className={cn("relations").elem("section-content").toClassName()}>
                  <RelationsComponent relationStore={relationStore} />
                </div>
              </>
            ) : (
              <EmptyState
                icon={<IconRelationLink width={24} height={24} />}
                header="Create relations between regions"
                description={<>Link regions to define relationships between them</>}
                learnMore={{
                  href: getDocsUrl("guide/labeling#Add-relations-between-annotations"),
                  text: "Learn more",
                  testId: "relations-panel-learn-more",
                }}
              />
            )}
          </div>
        </div>
      </>
    );
  }),
);

const HistoryTab: FC<any> = inject("store")(
  observer(function HistoryTab({ store, currentEntity }: any): JSX.Element {
    const showAnnotationHistory = store.hasInterface("annotations:history");

    return (
      <>
        <div className={cn("history").toClassName()}>
          <div className={cn("history").elem("section-tab").toClassName()}>
            <AnnotationHistory
              inline
              enabled={showAnnotationHistory}
              sectionHeader={
                <>
                  Annotation History
                  <span>#{currentEntity.pk ?? currentEntity.id}</span>
                </>
              }
            />
          </div>
        </div>
      </>
    );
  }),
);

const TaskFlagCheckbox: FC<{
  label: string;
  checked: boolean;
  activeColor: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, checked, activeColor, onChange }) => (
  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 0 4px 16px" }}>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      style={{ cursor: "pointer", width: 16, height: 16 }}
    />
    <span style={{ color: checked ? activeColor : "inherit" }}>{label}</span>
  </label>
);

const ImageUnreadableFlag: FC<any> = inject("store")(
  observer(function ImageUnreadableFlag({ store }: any): JSX.Element | null {
    const [showImageUnreadable, setShowImageUnreadable] = useState(false);

    useEffect(() => {
      const projectId = store.project?.id || window.location.pathname.match(/\/projects\/(\d+)/)?.[1];
      if (!projectId) return;

      fetch(`/api/projects/${projectId}/`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setShowImageUnreadable(!!data.show_image_unreadable);
          }
        })
        .catch(() => {});
    }, [store.project?.id, store.task?.id]);

    const patchTask = async (field: string, value: boolean) => {
      const csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1];

      const res = await fetch(`/api/tasks/${store.task.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
        body: JSON.stringify({ [field]: value }),
      });

      return res.ok;
    };

    return (
      <div className={cn("details").elem("section").toClassName()}>
        <div className={cn("details").elem("section-head").toClassName()}>Task Flags</div>
        <div className={cn("details").elem("section-content").toClassName()}>
          {showImageUnreadable && (
            <TaskFlagCheckbox
              label="Obraz nieczytelny"
              checked={store.task.image_unreadable}
              activeColor="#d00"
              onChange={async (e) => {
                const newValue = e.target.checked;

                if (await patchTask("image_unreadable", newValue)) {
                  store.task.setImageUnreadable(newValue);
                }
              }}
            />
          )}
          <TaskFlagCheckbox
            label="Zadanie zakonczone"
            checked={store.task.task_completed}
            activeColor="#080"
            onChange={async (e) => {
              const newValue = e.target.checked;

              if (await patchTask("task_completed", newValue)) {
                store.task.setTaskCompleted(newValue);
              }
            }}
          />
        </div>
      </div>
    );
  }),
);

const InfoTab: FC<any> = inject("store")(
  observer(function InfoTab({ store, selection }: any): JSX.Element {
    const nothingSelected = !selection || selection.size === 0;
    return (
      <>
        <ImageUnreadableFlag />
        <div className={cn("info").toClassName()}>
          <div className={cn("info").elem("section-tab").toClassName()}>
            {nothingSelected ? (
              <EmptyState
                icon={<IconCursor width={24} height={24} />}
                header="View region details"
                description={<>Select a region to view its properties, metadata and available actions</>}
              />
            ) : (
              <>
                <RegionsPanel regions={selection} />
              </>
            )}
          </div>
        </div>
      </>
    );
  }),
);

const GeneralPanel: FC<any> = inject("store")(
  observer(function GeneralPanel({ store, currentEntity }: any): JSX.Element {
    const { relationStore } = currentEntity;
    const showAnnotationHistory = store.hasInterface("annotations:history");
    return (
      <>
        <ImageUnreadableFlag />
        <div className={cn("details").elem("section").toClassName()}>
          <AnnotationHistory
            inline
            enabled={showAnnotationHistory}
            sectionHeader={
              <>
                Annotation History
                <span>#{currentEntity.pk ?? currentEntity.id}</span>
              </>
            }
          />
        </div>
        <div className={cn("details").elem("section").toClassName()}>
          <div className={cn("details").elem("view-control").toClassName()}>
            <div className={cn("details").elem("section-head").toClassName()}>Relations ({relationStore.size})</div>
            <RelationsControls relationStore={relationStore} />
          </div>
          <div className={cn("details").elem("section-content").toClassName()}>
            <RelationsComponent relationStore={relationStore} />
          </div>
        </div>
        {store.hasInterface("annotations:comments") && store.commentStore.isCommentable && (
          <div className={cn("details").elem("section").toClassName()}>
            <div className={cn("details").elem("section-head").toClassName()}>Comments</div>
            <div className={cn("details").elem("section-content").toClassName()}>
              <CommentsComponent
                annotationStore={store.annotationStore}
                commentStore={store.commentStore}
                cacheKey={`task.${store.task.id}`}
              />
            </div>
          </div>
        )}
      </>
    );
  }),
);

GeneralPanel.displayName = "GeneralPanel";

const RegionsPanel: FC<{ regions: any }> = observer(function RegionsPanel({ regions }: { regions: any }): JSX.Element {
  return (
    <div>
      {regions.list.map((reg: any) => {
        return <SelectedRegion key={reg.id} region={reg} />;
      })}
    </div>
  );
});

const SelectedRegion: FC<{ region: any }> = observer(function SelectedRegion({ region }: { region: any }): JSX.Element {
  return <RegionItem region={region} mainDetails={RegionDetailsMain} metaDetails={RegionDetailsMeta} />;
});

export const Comments = CommentsTab;
export const History = HistoryTab;
export const Relations = RelationsTab;
export const Info = InfoTab;
export const Details = observer(DetailsComponent);
export const DetailsPanel = observer(DetailsPanelComponent);
