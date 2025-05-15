import { Link, useLocation } from 'react-router-dom';

const DevToolsNav = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const links = [
    { path: '/test/verify-contracts', label: 'Verify Contracts' },
    { path: '/test/deploy-initialize', label: 'Deploy Guide' },
    { path: '/test/contracts-check', label: 'Test Contracts' },
    { path: '/dashboard', label: 'Back to Dashboard' }
  ];

  return (
    <div className="bg-blue-800 py-2 px-4 flex overflow-x-auto">
      <div className="flex space-x-4 mx-auto">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              isActive(link.path)
                ? 'bg-blue-700 text-white'
                : 'text-blue-100 hover:bg-blue-700 hover:text-white transition-colors'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DevToolsNav; 