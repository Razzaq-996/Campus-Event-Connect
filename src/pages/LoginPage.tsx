import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { GraduationCap, Users } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'student' | 'organizer'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentCredentials, setStudentCredentials] = useState({
    roll_no: 'S001',
    password: 'password',
  });

  const [organizerCredentials, setOrganizerCredentials] = useState({
    email: 'organizer@vnrvjiet.in',
    password: 'password',
  });

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('students')
        .select('*')
        .eq('roll_no', studentCredentials.roll_no)
        .eq('password', studentCredentials.password)
        .maybeSingle();

      if (dbError) throw dbError;

      if (!data) {
        setError('Invalid roll number or password');
        setLoading(false);
        return;
      }

      login(data, 'student');
      navigate('/student/dashboard');
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('organizers')
        .select('*')
        .eq('email', organizerCredentials.email)
        .eq('password', organizerCredentials.password)
        .maybeSingle();

      if (dbError) throw dbError;

      if (!data) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      login(data, 'organizer');
      navigate('/organizer/dashboard');
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <h1 className="text-3xl font-bold">Campus Event Connect</h1>
          <p className="text-blue-100 mt-1">VNR VJIET</p>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('student')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'student'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <GraduationCap size={20} />
              Student
            </button>
            <button
              onClick={() => setActiveTab('organizer')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'organizer'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users size={20} />
              Organizer
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 border border-red-200">
              {error}
            </div>
          )}

          {activeTab === 'student' ? (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                <input
                  type="text"
                  required
                  value={studentCredentials.roll_no}
                  onChange={(e) =>
                    setStudentCredentials({ ...studentCredentials, roll_no: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={studentCredentials.password}
                  onChange={(e) =>
                    setStudentCredentials({ ...studentCredentials, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOrganizerLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={organizerCredentials.email}
                  onChange={(e) =>
                    setOrganizerCredentials({ ...organizerCredentials, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={organizerCredentials.password}
                  onChange={(e) =>
                    setOrganizerCredentials({ ...organizerCredentials, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-blue-600 font-medium hover:text-blue-700"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
