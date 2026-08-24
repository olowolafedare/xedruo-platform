export const sportruoMock = {
  stats: { athletes: 1284, competitions: 18, venues: 42, opportunities: 76 },
  athletes: [
    { id: 'ath-001', name: 'Samuel Adeyemi', sport: 'Football', position: 'Forward', country: 'Nigeria', verified: true, rating: 82 },
    { id: 'ath-002', name: 'Daniel Okoro', sport: 'Football', position: 'Midfielder', country: 'Nigeria', verified: true, rating: 79 },
    { id: 'ath-003', name: 'Emeka Chukwu', sport: 'Basketball', position: 'Guard', country: 'Nigeria', verified: false, rating: 76 }
  ],
  competitions: [
    { id: 'cmp-001', name: 'SPORTRUO National Youth League', sport: 'Football', status: 'registration_open', teams: 24 },
    { id: 'cmp-002', name: 'West Africa Basketball Challenge', sport: 'Basketball', status: 'active', teams: 16 }
  ],
  venues: [
    { id: 'ven-001', name: 'National Sports Stadium', city: 'Lagos', country: 'Nigeria', verified: true, capacity: 60000 },
    { id: 'ven-002', name: 'Teslim Balogun Stadium', city: 'Lagos', country: 'Nigeria', verified: true, capacity: 24000 }
  ],
  opportunities: [
    { id: 'opp-001', title: 'U21 Forward Recruitment', organization: 'SPORTRUO Academy Network', sport: 'Football', location: 'Lagos', status: 'open' },
    { id: 'opp-002', title: 'Point Guard Trials', organization: 'Lagos Basketball Club', sport: 'Basketball', location: 'Lagos', status: 'open' }
  ]
};