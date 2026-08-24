export const ROLE_WORKSPACES = {
  athlete: ['Talent Acquisition','Player Management','Statistics','Events'],
  club: ['Talent Acquisition','Clubs & Teams','Transfers & Recruitment','Competitions','Statistics'],
  academy: ['Academies & Grassroots','Talent Acquisition','Player Development','Competitions'],
  league: ['League Registration','Competitions','Fixtures & Results','Statistics','Officials'],
  scout: ['Talent Acquisition','Scouting','Player Comparisons','AI Sports Intelligence'],
  agent: ['Talent Acquisition','Transfers & Recruitment','Athlete Management','Opportunities'],
  coach: ['Teams','Player Development','Performance Data','Fixtures'],
  official: ['Competitions','Appointments','Matches','Officials'],
  venue: ['Stadium & Venue Registration','Availability','Bookings','Events'],
  organizer: ['Events','Competitions','Venues','Ticketing'],
  sponsor: ['Sponsorship & Partnerships','Opportunities','Campaigns'],
  fan: ['Discover','Events & Tickets','Community','Sports Data'],
  media: ['Sports Media','Events','Match Coverage','Sports Data'],
  administrator: ['Platform Overview','Registrations','Verification','Analytics']
};

export function workspaceForRole(role) {
  return ROLE_WORKSPACES[role] || ROLE_WORKSPACES.fan;
}
