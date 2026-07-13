import React from "react";
import {COLOR_NAMES, ColorCode, ColorIdentity} from "@mtgit/shared";
import {Checkbox, Group} from "@mantine/core";

type ColorsSelectorProps = {
  colors: ColorIdentity;
  onChange: (newIndentity: ColorIdentity) => void;
};

export function ColorsSelector({colors, onChange}: ColorsSelectorProps) {
  // todo finish properly

  function handleColorToggle(colorCode: ColorCode) {
    const newIdentity = colors.includes(colorCode)
      ? colors.filter(color => color !== colorCode)
      : [...colors, colorCode];

    onChange(newIdentity);
  }

  return <Group>
    {Object.entries(COLOR_NAMES)
      .map(
        ([code, name]: [ColorCode, string]) => <Group>
          <Checkbox value={colors[code]} onClick={() => handleColorToggle(code)} label={name}/>
        </Group>
      )}
  </Group>;
}