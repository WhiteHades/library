const { buildPublishModel, buildNavigationTree } = require("./publishUtils");

function makeNote({ filePathStem, url, data = {} }) {
  return {
    filePathStem: `/notes${filePathStem}`,
    url,
    fileSlug: data.title || filePathStem.split("/").pop(),
    data: {
      type: "note",
      "dg-publish": true,
      ...data,
    },
  };
}

describe("publishUtils", () => {
  const data = {
    publish: {
      channels: [
        { key: "dawahwise", name: "DawahWise", url: "https://youtube.com/@DawahWise" },
      ],
      series: [
        { key: "dawahwise/universal-truth", channel: "dawahwise", idea: "hinduism", title: "Universal Truth" },
      ],
      home: { featuredIdeas: ["hinduism"], recentLimit: 12 },
    },
    collections: {
      note: [
        makeNote({
          filePathStem: "/00_publish/hinduism/overview",
          url: "/hinduism/",
          data: {
            title: "Hinduism",
            page_kind: "idea-overview",
            channel: "mohammed-efaz",
            ideas: ["[[hinduism]]"],
            "dg-path": "hinduism/overview.md",
          },
        }),
        makeNote({
          filePathStem: "/00_publish/hinduism/01_note",
          url: "/hinduism/01-note/",
          data: {
            title: "1. Note",
            page_kind: "note",
            channel: "dawahwise",
            series: "dawahwise/universal-truth",
            order: 1,
            ideas: ["[[hinduism]]"],
            after: "hinduism/02_note.md",
            "dg-path": "hinduism/01_note.md",
          },
        }),
        makeNote({
          filePathStem: "/00_publish/hinduism/02_note",
          url: "/hinduism/02-note/",
          data: {
            title: "2. Note",
            page_kind: "note",
            channel: "dawahwise",
            series: "dawahwise/universal-truth",
            order: 2,
            ideas: ["[[hinduism]]"],
            before: "hinduism/01_note.md",
            "dg-path": "hinduism/02_note.md",
          },
        }),
      ],
    },
  };

  it("builds ideas and ordered series chains", () => {
    const model = buildPublishModel(data);
    expect(model.ideas).toHaveLength(1);
    expect(model.ideas[0].key).toBe("hinduism");
    expect(model.seriesMap["dawahwise/universal-truth"].notes.map((note) => note.title)).toEqual(["1. Note", "2. Note"]);
  });

  it("builds a navigator with overview, channels, and series buckets", () => {
    const model = buildPublishModel(data);
    const tree = buildNavigationTree(model, "/hinduism/02-note/");
    expect(tree[0].label).toBe("Hinduism");
    expect(tree[0].children.map((child) => child.label)).toEqual(["Overview", "Channels", "Series"]);
    expect(tree[0].defaultOpen).toBe(true);
  });
});
