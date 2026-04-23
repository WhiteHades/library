const { getGraph } = require("../../helpers/linkUtils");
const { getFileTree } = require("../../helpers/filetreeUtils");
const { buildPublishModel, buildNavigationTree } = require("../../helpers/publishUtils");
const { userComputed } = require("../../helpers/userUtils");

module.exports = {
  graph: async (data) => await getGraph(data),
  filetree: (data) => getFileTree(data),
  publishModel: (data) => buildPublishModel(data),
  navigationTree: (data) => buildNavigationTree(buildPublishModel(data), data.page && data.page.url ? data.page.url : data.permalink),
  userComputed: (data) => userComputed(data),
  noteProps: (data) => data["dg-note-properties"]
};
