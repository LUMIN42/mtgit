import React from "react";
import {Switch} from "@mantine/core";
import {useRepositoryPreferences} from "../../context/RepositoryPreferencesContext.tsx";

export function QuickEditSwitch() {
  const prefs = useRepositoryPreferences();

  return (
    <Switch
      label={"Quick Edit"}
      checked={prefs.preferences.quickEdit}
      onChange={(e) => prefs.updatePreferences({quickEdit: e.currentTarget.checked})}
    />
  );
}
