const C = {
  surface: "#fffdf8",
  text: "#4a3728",
  orange: "#f2913d",
  amber: "#ffc65c",
  line: "#e6d5bd",
};

export type BowlMood = 1 | 2 | 3 | 4 | 5;
export type BowlPose =
  | "idle" | "wave" | "thinking" | "listen" | "input" | "working"
  | "idea" | "deliver" | "copy" | "celebrate" | "remind";

interface BowlMascotProps {
  className?: string;
  mood?: BowlMood;
  pose?: BowlPose;
  withSlip?: boolean;
  still?: boolean;
}

function mascotSvg(mood: BowlMood, pose: BowlPose, withSlip: boolean): string {
  const outline = C.text;
  const happy = mood >= 4;
  const transform: Record<BowlPose, string> = {
    idle: "translate(0 0)", wave: "translate(0 -3) rotate(-3 60 66)",
    thinking: "translate(0 0) rotate(-2 60 72)", listen: "translate(0 1)",
    input: "translate(0 0) rotate(-2 60 72)", working: "translate(0 1) rotate(2 60 66)",
    idea: "translate(0 -2) rotate(-2 60 66)", deliver: "translate(0 -2) rotate(-2 60 66)",
    copy: "translate(0 -3)", celebrate: "translate(0 -5)", remind: "translate(0 -1) rotate(2 60 66)",
  };
  const eyes = happy
    ? `<path d="M39 69Q45 62 51 69M66 69Q72 62 78 69" fill="none" stroke="${outline}" stroke-width="3.2" stroke-linecap="round"/>`
    : `<ellipse cx="45" cy="69" rx="3.8" ry="5" fill="${outline}"/><ellipse cx="73" cy="69" rx="3.8" ry="5" fill="${outline}"/>`;
  const brows = mood <= 2
    ? `<path d="M38 60Q44 56 50 59M80 60Q74 56 68 59" fill="none" stroke="${outline}" stroke-width="2.4" stroke-linecap="round"/>`
    : "";
  const mouths: Record<BowlMood, string> = {
    1: `<path d="M51 82Q59 75 67 82" fill="none" stroke="${outline}" stroke-width="2.8" stroke-linecap="round"/>`,
    2: `<path d="M52 80Q59 76 66 80" fill="none" stroke="${outline}" stroke-width="2.8" stroke-linecap="round"/>`,
    3: `<path d="M53 79H65" fill="none" stroke="${outline}" stroke-width="2.8" stroke-linecap="round"/>`,
    4: `<path d="M51 77Q59 85 67 77" fill="none" stroke="${outline}" stroke-width="2.8" stroke-linecap="round"/>`,
    5: `<path d="M49 76Q59 89 69 76Z" fill="${outline}"/><path d="M54 83Q59 87 64 83" fill="none" stroke="#ff9a84" stroke-width="2.5" stroke-linecap="round"/>`,
  };
  const raisedLeft = `<path d="M22 68C12 63 10 54 15 45" fill="none" stroke="${outline}" stroke-width="3.2" stroke-linecap="round"/><circle cx="16" cy="43" r="4.2" fill="${C.surface}" stroke="${outline}" stroke-width="2.4"/>`;
  const raisedRight = `<path d="M96 68C106 63 108 54 103 45" fill="none" stroke="${outline}" stroke-width="3.2" stroke-linecap="round"/><circle cx="102" cy="43" r="4.2" fill="${C.surface}" stroke="${outline}" stroke-width="2.4"/>`;
  const leftArm = ["wave", "idea", "celebrate"].includes(pose)
    ? raisedLeft
    : pose === "thinking"
      ? `<path d="M22 70C13 71 13 80 22 82C28 83 31 78 34 74" fill="none" stroke="${outline}" stroke-width="3.1" stroke-linecap="round"/>`
      : `<path d="M22 70C13 70 11 77 14 83" fill="none" stroke="${outline}" stroke-width="3.1" stroke-linecap="round"/>`;
  const rightArm = withSlip
    ? `<path d="M96 69C103 66 102 60 96 56" fill="none" stroke="${outline}" stroke-width="3.1" stroke-linecap="round"/>`
    : ["celebrate", "remind"].includes(pose) ? raisedRight
      : `<path d="M96 70C104 72 107 78 104 84" fill="none" stroke="${outline}" stroke-width="3.1" stroke-linecap="round"/>`;
  const slip = withSlip
    ? `<g transform="rotate(7 96 62)"><rect x="84" y="39" width="27" height="36" rx="3.5" fill="${C.surface}" stroke="${outline}" stroke-width="2.2"/><path d="M90 49H105" stroke="${C.orange}" stroke-width="2.2" stroke-linecap="round"/><path d="M90 56H105M90 63H101" stroke="${C.line}" stroke-width="2" stroke-linecap="round"/></g>`
    : "";
  const accessory = pose === "idea"
    ? `<g><path d="M96 48C92 40 98 32 106 33C114 34 117 43 111 49C108 52 108 55 108 58H101C101 54 100 51 96 48Z" fill="#fff0a8" stroke="${outline}" stroke-width="2.3"/><path d="M101 61H109M102 65H108" stroke="${outline}" stroke-width="2.2" stroke-linecap="round"/></g>`
    : pose === "remind"
      ? `<g transform="rotate(-8 105 62)"><path d="M97 55L114 48V69L97 64Z" fill="#ff9a84" stroke="${outline}" stroke-width="2.4"/><rect x="91" y="55" width="8" height="10" rx="3" fill="${C.surface}" stroke="${outline}" stroke-width="2.3"/></g>`
      : pose === "thinking"
        ? `<path d="M100 31C99 23 110 22 112 29C113 34 107 35 107 40" fill="none" stroke="${outline}" stroke-width="2.8" stroke-linecap="round"/><circle cx="107" cy="46" r="2" fill="${outline}"/>`
        : "";
  const marks: Partial<Record<BowlPose, string>> = {
    wave: `<path d="M7 31L2 26M15 27L14 19M23 29L27 23" stroke="${C.amber}" stroke-width="3" stroke-linecap="round"/>`,
    working: `<path d="M8 68Q2 72 8 76M11 82Q5 86 11 90M108 69Q114 73 108 77" fill="none" stroke="#73b9d8" stroke-width="2.6" stroke-linecap="round"/>`,
    copy: `<path d="M104 28L106.5 34L112.5 36.5L106.5 39L104 45L101.5 39L95.5 36.5L101.5 34Z" fill="${C.amber}"/>`,
    celebrate: `<path d="M18 19C13 14 7 21 18 29C29 21 23 14 18 19ZM100 13C95 8 89 15 100 23C111 15 105 8 100 13Z" fill="#ff8f82"/>`,
  };

  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="111" rx="31" ry="4" fill="#efcb91" opacity=".5"/>${marks[pose] ?? ""}<g transform="${transform[pose]}">${accessory}<path d="M98 54C113 45 118 55 115 66C113 75 106 80 99 76" fill="none" stroke="${outline}" stroke-width="3.2" stroke-linecap="round"/><rect x="37" y="92" width="18" height="15" rx="6" fill="${C.surface}" stroke="${outline}" stroke-width="2.6"/><rect x="66" y="92" width="18" height="15" rx="6" fill="${C.surface}" stroke="${outline}" stroke-width="2.6"/>${leftArm}${rightArm}<path d="M18 47C20 78 34 98 59 99C84 98 98 79 100 47Z" fill="${C.surface}" stroke="${outline}" stroke-width="2.8"/><path d="M27 49C25 43 29 38 35 38C34 32 40 28 46 30C48 23 57 21 62 26C68 21 77 24 78 31C85 29 91 35 89 41C95 41 98 45 96 50Z" fill="white" stroke="${outline}" stroke-width="2.5"/><g fill="#f7d89b" opacity=".55"><ellipse cx="43" cy="39" rx="2.2" ry="1.4"/><ellipse cx="56" cy="31" rx="2.2" ry="1.4"/><ellipse cx="69" cy="36" rx="2.2" ry="1.4"/><ellipse cx="81" cy="41" rx="2.2" ry="1.4"/></g><path d="M18 45Q59 36 101 44L100 52Q59 44 19 53Z" fill="${C.orange}" stroke="${outline}" stroke-width="2.5"/><path d="M25 46Q59 40 94 45" fill="none" stroke="#ffd18e" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="34" cy="80" rx="6" ry="4" fill="#ffaea0" opacity=".7"/><ellipse cx="84" cy="80" rx="6" ry="4" fill="#ffaea0" opacity=".7"/>${brows}${eyes}${mouths[mood]}${slip}</g></svg>`;
}

export function BowlMascot({ className = "mascot mascot-hero", mood = 5, pose = "idle", withSlip = false, still = false }: BowlMascotProps) {
  return <span aria-label="吉祥物小碰碗" className={`${className}${still ? "" : " mascot-float"}`} dangerouslySetInnerHTML={{ __html: mascotSvg(mood, pose, withSlip) }} role="img" />;
}

function faceSvg(mood: BowlMood): string {
  const mouths: Record<BowlMood, string> = {
    1: "M16.8 28.5Q20 25.6 23.2 28.5", 2: "M17 28.2Q20 26.2 23 28.2",
    3: "M17.2 27.8H22.8", 4: "M17 27.1Q20 29.8 23 27.1", 5: "M16.7 26.8Q20 31 23.3 26.8",
  };
  const happyEyes = `<path d="M12.8 23.4Q15.3 20.7 17.8 23.4M22.2 23.4Q24.7 20.7 27.2 23.4" fill="none" stroke="${C.text}" stroke-width="1.7" stroke-linecap="round"/>`;
  const normalEyes = `<ellipse cx="15.2" cy="23.2" rx="1.6" ry="2" fill="${C.text}"/><ellipse cx="24.8" cy="23.2" rx="1.6" ry="2" fill="${C.text}"/>`;
  const poses: Record<BowlMood, string> = {
    1: `<path d="M11 27C6 29 7 35 12 35M29 27C34 29 33 35 28 35" fill="none" stroke="${C.text}" stroke-width="1.7" stroke-linecap="round"/><path d="M10 20C7 24 8 27 10 29C12 27 13 24 10 20ZM32 18C29 22 30 25 32 27C34 25 35 22 32 18Z" fill="#75bfe5"/>`,
    2: `<path d="M11 28C8 32 12 35 17 32M29 28C32 32 28 35 23 32" fill="none" stroke="${C.text}" stroke-width="1.7" stroke-linecap="round"/>`,
    3: `<path d="M10 27C6 28 6 33 10 34M30 27C34 28 34 33 30 34" fill="none" stroke="${C.text}" stroke-width="1.7" stroke-linecap="round"/>`,
    4: `<path d="M11 28C7 29 9 34 14 31M29 28C33 29 31 34 26 31" fill="none" stroke="${C.text}" stroke-width="1.7" stroke-linecap="round"/><circle cx="13" cy="29" r="2.1" fill="${C.surface}" stroke="${C.text}" stroke-width="1.3"/><circle cx="27" cy="29" r="2.1" fill="${C.surface}" stroke="${C.text}" stroke-width="1.3"/>`,
    5: `<path d="M10 27C5 25 5 20 8 17M30 27C35 25 35 20 32 17" fill="none" stroke="${C.text}" stroke-width="1.8" stroke-linecap="round"/><path d="M7 8C4 5 1 9 7 13C13 9 10 5 7 8ZM34 6C31 3 28 7 34 11C40 7 37 3 34 6Z" fill="#ff8f82"/>`,
  };
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><ellipse cx="20" cy="38" rx="10" ry="1.6" fill="#efcb91" opacity=".45"/><path d="M30 19C36 15 38 21 34 25C33 27 31 28 30 27" fill="none" stroke="${C.text}" stroke-width="1.5"/><rect x="14" y="31" width="5" height="6" rx="2.2" fill="${C.surface}" stroke="${C.text}" stroke-width="1.35"/><rect x="22" y="31" width="5" height="6" rx="2.2" fill="${C.surface}" stroke="${C.text}" stroke-width="1.35"/><path d="M9 18C9.5 27 13.8 33 20 33C26.2 33 30.5 27 31 18Z" fill="${C.surface}" stroke="${C.text}" stroke-width="1.5"/><path d="M12 18C11 14 14 12 17 13C17 9 22 8 23 12C27 10 30 14 28 18Z" fill="white" stroke="${C.text}" stroke-width="1.35"/><path d="M9 17.5Q20 14 31 17.5L30.5 20Q20 17.7 9.5 20Z" fill="${C.orange}" stroke="${C.text}" stroke-width="1.35"/><circle cx="12.5" cy="27" r="1.5" fill="#ffaea0"/><circle cx="27.5" cy="27" r="1.5" fill="#ffaea0"/>${mood >= 4 ? happyEyes : normalEyes}<path d="${mouths[mood]}" fill="none" stroke="${C.text}" stroke-width="1.7" stroke-linecap="round"/>${poses[mood]}</svg>`;
}

export function BowlFace({ mood }: { mood: BowlMood }) {
  return <span aria-hidden="true" className="bowl-face" dangerouslySetInnerHTML={{ __html: faceSvg(mood) }} />;
}
