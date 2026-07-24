import { Location } from "@/app/generated/prisma";
import { optimizeItinerary } from "@/lib/actions/optimize-itinerary";
import type { OptimizeItineraryResult } from "@/lib/actions/optimize-itinerary";
import { reorderItinerary } from "@/lib/actions/reorder-itineraty";
import { deleteLocation } from "@/lib/actions/delete-location";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  Clock3,
  GripVertical,
  LoaderCircle,
  Route,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useId, useState } from "react";
import { Button } from "./ui/button";

interface SortableItineraryProps {
  locations: Location[];
  tripId: string;
}

type OptimizationPreview = Extract<OptimizeItineraryResult, { ok: true }>;

function formatDuration(totalSeconds: number) {
  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

function SortableItem({
  item,
  position,
  isFinal,
  isDeleting,
  onDelete,
}: {
  item: Location;
  position: number;
  isFinal: boolean;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="group flex items-center justify-between gap-3 rounded-lg border bg-white p-4 transition-shadow hover:shadow"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${item.locationTitle}`}
          className="cursor-grab touch-none rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
          {position + 1}
        </div>
        <div className="min-w-0">
          <h4 className="truncate font-medium text-gray-800">
            {item.locationTitle}
          </h4>
          <p className="truncate text-sm text-gray-500">
            {position === 0
              ? "Fixed starting point"
              : isFinal
              ? "Fixed final stop"
              : `Stop ${position + 1}`}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting}
        aria-label={`Delete ${item.locationTitle}`}
        className="rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
      >
        {isDeleting ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export default function SortableItinerary({
  locations,
  tripId,
}: SortableItineraryProps) {
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [localLocation, setLocalLocation] = useState(locations);
  const [preview, setPreview] = useState<OptimizationPreview | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(
    null
  );
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localLocation.findIndex((item) => item.id === active.id);
      const newIndex = localLocation.findIndex((item) => item.id === over.id);

      const newLocationsOrder = arrayMove(
        localLocation,
        oldIndex,
        newIndex
      ).map((item, index) => ({ ...item, order: index }));

      setLocalLocation(newLocationsOrder);
      setPreview(null);
      setMessage(null);

      try {
        await reorderItinerary(
          tripId,
          newLocationsOrder.map((item) => item.id)
        );
      } catch {
        setLocalLocation(localLocation);
        setMessage({
          tone: "error",
          text: "The new order could not be saved. Please try again.",
        });
      }
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setPreview(null);
    setMessage(null);

    try {
      const result = await optimizeItinerary(tripId);

      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }

      setPreview(result);
    } catch {
      setMessage({
        tone: "error",
        text: "Route optimization failed. Please try again.",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const optimizedLocations = preview
    ? preview.orderedLocationIds
        .map((locationId) =>
          localLocation.find((location) => location.id === locationId)
        )
        .filter((location): location is Location => Boolean(location))
    : [];

  const handleSaveOptimization = async () => {
    if (!preview) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await reorderItinerary(tripId, preview.orderedLocationIds);
      setLocalLocation(
        optimizedLocations.map((location, order) => ({ ...location, order }))
      );
      setPreview(null);
      setMessage({
        tone: "success",
        text: "Optimized itinerary saved.",
      });
    } catch {
      setMessage({
        tone: "error",
        text: "The optimized route could not be saved. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const canOptimize = localLocation.length >= 4;

  const handleDeleteLocation = async (location: Location) => {
    if (
      !window.confirm(
        `Remove “${location.locationTitle}” from this itinerary?`
      )
    ) {
      return;
    }

    setDeletingLocationId(location.id);
    setMessage(null);
    setPreview(null);

    try {
      await deleteLocation(tripId, location.id);
      setLocalLocation((current) =>
        current
          .filter(({ id: locationId }) => locationId !== location.id)
          .map((item, order) => ({ ...item, order }))
      );
      setMessage({
        tone: "success",
        text: "Destination removed from the itinerary.",
      });
    } catch {
      setMessage({
        tone: "error",
        text: "The destination could not be removed. Please try again.",
      });
    } finally {
      setDeletingLocationId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <Route className="h-5 w-5 text-blue-600" aria-hidden="true" />
              Optimize driving route
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Keep your first and last stops fixed while finding a faster order
              for the stops between them.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleOptimize}
            disabled={!canOptimize || isOptimizing || isSaving}
            className="shrink-0 bg-blue-600 hover:bg-blue-700"
          >
            {isOptimizing ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Calculating
              </>
            ) : (
              <>
                <Sparkles aria-hidden="true" />
                Optimize route
              </>
            )}
          </Button>
        </div>

        {!canOptimize && (
          <p className="mt-3 text-sm text-gray-500">
            Add at least four stops to optimize a route with fixed endpoints.
          </p>
        )}
      </div>

      {message && (
        <div
          role={message.tone === "error" ? "alert" : "status"}
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.tone === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {preview && (
        <section
          aria-labelledby="optimization-preview-title"
          className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50"
        >
          <div className="border-b border-emerald-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  id="optimization-preview-title"
                  className="flex items-center gap-2 font-semibold text-gray-900"
                >
                  <Sparkles
                    className="h-5 w-5 text-emerald-600"
                    aria-hidden="true"
                  />
                  Optimization preview
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Review the suggested order before saving it.
                </p>
              </div>
              {preview.savingsSeconds > 0 && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  {Math.round(preview.savingsPercent)}% faster
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Current route
                </p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  {formatDuration(preview.originalDurationSeconds)}
                </p>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Optimized route
                </p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Route className="h-4 w-4" aria-hidden="true" />
                  {formatDuration(preview.optimizedDurationSeconds)}
                </p>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Estimated savings
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-700">
                  {preview.savingsSeconds > 0
                    ? formatDuration(preview.savingsSeconds)
                    : "Already optimal"}
                </p>
              </div>
            </div>
          </div>

          <ol className="space-y-2 p-5">
            {optimizedLocations.map((location, index) => (
              <li
                key={location.id}
                className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm text-gray-700"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                  {index + 1}
                </span>
                <span className="truncate">{location.locationTitle}</span>
                {(index === 0 ||
                  index === optimizedLocations.length - 1) && (
                  <span className="ml-auto shrink-0 text-xs text-gray-400">
                    Fixed
                  </span>
                )}
              </li>
            ))}
          </ol>

          <div className="flex flex-col-reverse gap-2 border-t border-emerald-200 p-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreview(null)}
              disabled={isSaving}
            >
              Keep current order
            </Button>
            {preview.savingsSeconds > 0 && (
              <Button
                type="button"
                onClick={handleSaveOptimization}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving ? (
                  <>
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                    Saving
                  </>
                ) : (
                  <>
                    <Check aria-hidden="true" />
                    Save optimized route
                  </>
                )}
              </Button>
            )}
          </div>
        </section>
      )}

      <DndContext
        id={id}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localLocation.map((loc) => loc.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {localLocation.map((item, index) => (
              <SortableItem
                key={item.id}
                item={item}
                position={index}
                isFinal={
                  index === localLocation.length - 1 &&
                  localLocation.length > 1
                }
                isDeleting={deletingLocationId === item.id}
                onDelete={() => handleDeleteLocation(item)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
