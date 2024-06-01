import { ConditionGroup } from "./parts/ConditionGroup.js";
import { UserTaskGroup } from "./parts/UserTaskLesson.js";

export default function CustomPropertiesProvider(propertiesPanel, translate) {

  this.getGroups = function(element) {
    return function(groups) {

      const deleteCamundaPlatformGroups = (groups) => {
        return groups.filter(group => !(group.id.startsWith("CamundaPlatform__")));
      };

      const conditionGroup= ConditionGroup(element, translate);
      const userTaskLessonGroup = UserTaskGroup(element, translate)

      let filteredGroups = deleteCamundaPlatformGroups(groups);

      if(conditionGroup !== null){
        filteredGroups.push(conditionGroup);
      }

      if(userTaskLessonGroup !== null){
        filteredGroups.push(userTaskLessonGroup);
      }

      return filteredGroups;

    };
  };

  propertiesPanel.registerProvider(500, this);
}

CustomPropertiesProvider.$inject = [ 'propertiesPanel', 'translate' ];

function createMagicGroup(element, translate) {

  // create a group called "Magic properties".
  const magicGroup = {
    id: 'magic',
    label: translate('Magic properties'),
    entries: spellProps(element),
    tooltip: translate('Make sure you know what you are doing!')
  };

  return magicGroup;
}
