/**
 * Line icons in the identity's drawing style: 24px grid, 2px stroke, round caps.
 * Values are the inner SVG markup; <Icon /> wraps them.
 */
export const icons = {
  arrow: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  'arrow-circle': '<circle cx="12" cy="12" r="10"/><path d="m12 8-4 4 4 4M16 12H8"/>',
  fork: '<path d="M12 21v-8M12 13 6 7M12 13l6-6M12 13V3M9 6l3-3 3 3M6 11V7h4M18 11V7h-4"/>',
  bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4"/>',
  flag: '<path d="M4 22V4"/><path d="M4 4h14l-2.5 4.5L18 13H4"/>',
  play: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9.5 5 2.5-5 2.5z"/>',
  monitor: '<rect x="3" y="3" width="18" height="13" rx="3"/><path d="M8 21h8M12 16v5"/><circle cx="12" cy="8" r="2"/><path d="M8.5 13.5a3.5 3.5 0 0 1 7 0"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 14h6M12 17v-6"/>',
  pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
  cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>',
  pen: '<path d="M15.7 21.3a1 1 0 0 1-1.4 0l-1.6-1.6a1 1 0 0 1 0-1.4l5.6-5.6a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4z"/><path d="m18 13-1.4-6.9a1 1 0 0 0-.7-.8L3.2 2a1 1 0 0 0-1.2 1.2L5.3 15.9a1 1 0 0 0 .8.7L13 18M2.3 2.3l7.3 7.3"/><circle cx="11" cy="11" r="2"/>',
  flask: '<path d="M10 2v7.5L4 20a1 1 0 0 0 .9 1.5h14.2A1 1 0 0 0 20 20l-6-10.5V2M8.5 2h7M7 16h10"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/>',
} as const;

export type IconName = keyof typeof icons;
