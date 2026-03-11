import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import { useEffect, useState } from 'react';
import { auth } from '../services/firebase';

const DebugRole = () => {
  const { user } = useAuth();
  const { role } = useRole();
  const [token, setToken] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      if (user) {
        const idToken = await user.getIdTokenResult();
        setToken(idToken);
        console.log('ID Token Result:', idToken);
        console.log('Custom Claims:', idToken.claims);
        console.log('Role from claims:', idToken.claims.role);
      }
    };
    getToken();
  }, [user]);

  if (!user) return <div>Not logged in</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Role Information</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="font-semibold mb-2">User Info:</h2>
        <pre className="bg-white p-2 rounded">
          {JSON.stringify({
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
          }, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="font-semibold mb-2">Role from useRole hook:</h2>
        <div className="bg-white p-2 rounded">
          Role: <strong>{role || 'undefined'}</strong>
        </div>
      </div>

      {token && (
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <h2 className="font-semibold mb-2">Custom Claims from Token:</h2>
          <pre className="bg-white p-2 rounded overflow-auto">
            {JSON.stringify(token.claims, null, 2)}
          </pre>
        </div>
      )}

      <div className="bg-yellow-100 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Expected Admin Access:</h2>
        <ul className="list-disc pl-5">
          <li>/admin - {role === 'admin' ? '✅ Accessible' : '❌ Hidden'}</li>
          <li>/admin/analytics - {role === 'admin' ? '✅ Accessible' : '❌ Hidden'}</li>
          <li>/admin/menu - {role === 'admin' ? '✅ Accessible' : '❌ Hidden'}</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugRole;