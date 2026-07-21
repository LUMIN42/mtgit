import {Affix, ActionIcon, Transition} from "@mantine/core";
import {IconArrowUp} from "@tabler/icons-react";
import {useWindowScroll} from "@mantine/hooks";

export function ScrollToTopButton() {
  const [scroll, scrollTo] = useWindowScroll();

  return (
    <Affix position={{bottom: 20, right: 20}}>
      <Transition
        mounted={scroll.y > 100}
        transition="slide-up"
      >
        {transitionStyles => (
          <ActionIcon
            style={transitionStyles}

            styles={{
              root: {
                backgroundColor: "#fffe"
              }
            }}
            size="lg"
            radius="xl"
            onClick={() => scrollTo({y: 0})}
            variant={"outline"}
          >
            <IconArrowUp/>
          </ActionIcon>
        )}
      </Transition>
    </Affix>
  );
}