import LeaseAgreements from './LeaseAgreements';

const menuItems = [
  {
    text: 'Lease Agreements',
    icon: <DescriptionIcon />,
    path: '/admin/lease-agreements'
  }
];

<Route path="/admin/lease-agreements" element={<LeaseAgreements />} /> 