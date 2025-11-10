import { createAvatar } from "@dicebear/core";
import { botttsNeutral, initials, thumbs } from "@dicebear/collection";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GeneratedAvatarProps {
  seed: string;
  className?: string;
  variant: "botttsNeutral" | "initials" | "thumbs";
}

const GeneratedAvatar = ({
  seed,
  className,
  variant,
}: GeneratedAvatarProps) => {
  let avatar;

  if (variant === "botttsNeutral") {
    avatar = createAvatar(
      // botttsNeutral // just for now
      thumbs,
      {
        seed: seed,
      }
    );
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

  return (
    <Avatar className={cn(className)}>
      <AvatarImage src={avatar.toDataUri()} alt="Avatar" />
      <AvatarFallback>{seed.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
};

export default GeneratedAvatar;
