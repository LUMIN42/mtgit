import React from "react";
import {COLOR_CODE_TO_NAMES, ColorCode, ColorCombination} from "@mtgit/shared";
import {Checkbox, Group} from "@mantine/core";

type ColorsSelectorProps = {
  colors: ColorCombination;
  onChange: (newIndentity: ColorCombination) => void;
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
    {Object.entries(COLOR_CODE_TO_NAMES)
      .map(
        ([code, name]: [ColorCode, string]) => <Group>
          <Checkbox value={colors[code]} onClick={() => handleColorToggle(code)} label={name}/>
        </Group>
      )}
  </Group>;
}