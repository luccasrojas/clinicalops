import { createAvatar } from "@dicebear/core";
import { botttsNeutral, initials, thumbs } from "@dicebear/collection";

interface Props {
  seed: string;
  variant: "bottsNeutral" | "initials" | "thumbs";
}

export const generateAvatarUri = ({ seed, variant }: Props) => {
  let avatar;

  if (variant === "bottsNeutral") {
    avatar = createAvatar(botttsNeutral, {
      seed,
    });
  } else if (variant === "thumbs") {
    avatar = createAvatar(thumbs, {
      seed,
    });
  } else {
    avatar = createAvatar(initials, {
      seed,
      fontWeight: 500,
      fontSize: 42,
    });
  }

  return avatar.toDataUri();
};
