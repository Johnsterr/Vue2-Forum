export const makeAppendChildToParentMutation = ({ parent, child }) =>
  (state, { childId, parentId }) => {
    const resource = state.items[parentId];
    if (!resource[child]) {
      resource.child = {};
    }
    resource[child].childId = childId;
  };