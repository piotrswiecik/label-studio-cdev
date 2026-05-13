/* global describe, test, expect */
import { getCurrentImageMetadataText } from "../ImageView";

describe("getCurrentImageMetadataText", () => {
  test("formats patient, projection, and frame metadata for the current image", () => {
    expect(
      getCurrentImageMetadataText(
        {
          patient_id: "25",
          image_items: [
            {
              projection_id: "I0547398",
              frame_number: 10,
            },
          ],
        },
        0,
      ),
    ).toBe("Pacjent: 25 · Projekcja: I0547398 · klatka: 10");
  });

  test("formats clinical projection display when present", () => {
    expect(
      getCurrentImageMetadataText(
        {
          patient_id: "25",
          image_items: [
            {
              projection_id: "I0547398",
              frame_number: 10,
              projection: {
                display: "RAO 18",
              },
            },
          ],
        },
        0,
      ),
    ).toBe("Pacjent: 25 · Projekcja: I0547398 · klatka: 10 · RAO 18");
  });

  test("does not display raw signed DICOM projection angles", () => {
    expect(
      getCurrentImageMetadataText(
        {
          patient_id: "25",
          image_items: [
            {
              projection_id: "I0547398",
              frame_number: 10,
              dicom: {
                positioner_primary_angle: -17.9,
                positioner_secondary_angle: 0.4,
              },
            },
          ],
        },
        0,
      ),
    ).toBe("Pacjent: 25 · Projekcja: I0547398 · klatka: 10");
  });

  test("keeps old metadata output when DICOM metadata is missing", () => {
    expect(
      getCurrentImageMetadataText(
        {
          patient_id: "25",
          image_items: [
            {
              projection_id: "I0547398",
              frame_number: 10,
            },
          ],
        },
        0,
      ),
    ).toBe("Pacjent: 25 · Projekcja: I0547398 · klatka: 10");
  });

  test("omits missing image item metadata", () => {
    expect(getCurrentImageMetadataText({ patient_id: "25" }, 0)).toBeNull();
    expect(getCurrentImageMetadataText({ patient_id: "25", image_items: {} }, 0)).toBeNull();
    expect(getCurrentImageMetadataText({ patient_id: "25", image_items: [] }, 0)).toBeNull();
    expect(getCurrentImageMetadataText({ patient_id: "25", image_items: [{ projection_id: "I0547398" }] }, 1)).toBeNull();
  });

  test("formats partial metadata without crashing", () => {
    expect(getCurrentImageMetadataText({ image_items: [{ projection_id: "I0547398" }] }, 0)).toBe(
      "Projekcja: I0547398",
    );
    expect(getCurrentImageMetadataText({ image_items: [{ frame_number: 10 }] }, 0)).toBe("klatka: 10");
  });
});
