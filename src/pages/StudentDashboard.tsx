import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

import {
  Calendar,
  MapPin,
  Clock,
  Bell,
  LogOut,
  User,
  BookOpen,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
}

interface Registration {
  id: string;
  event_id: string;
  events: Event;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, userRole, logout } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<Registration[]>([]);
  const [notifications, setNotifications] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    if (userRole !== 'student') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [userRole, navigate]);

  const fetchData = async () => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const { data: events } = await supabase
        .from('events')
        .select('*')
        .gte('date', todayStr)
        .order('date', { ascending: true });

      const { data: registrations } = await supabase
        .from('registrations')
        .select('*, events(*)')
        .eq('student_id', user?.id);

      const { data: todayTomorrowEvents } = await supabase
        .from('events')
        .select('*')
        .in('date', [todayStr, tomorrowStr])
        .order('date', { ascending: true });

      setUpcomingEvents(events || []);
      setRegisteredEvents(registrations || []);
      setNotifications(todayTomorrowEvents || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: Event) => {
    if (!user || !('attendance_percentage' in user)) return;

    if (user.attendance_percentage < 70) {
      alert('You are not eligible. Minimum 70% attendance required.');
      return;
    }

    setRegistering(event.id);
    try {
      const { error } = await supabase.from('registrations').insert([
        {
          student_id: user.id,
          event_id: event.id,
          event_date: event.date,
          event_time: event.time,
        },
      ]);

      if (error) {
        if (error.code === '23505') {
          alert('You are already registered for this event');
        } else {
          throw error;
        }
      } else {
        alert('Successfully registered for the event!');
        fetchData();
      }
    } catch (error) {
      alert('Registration failed. Please try again.');
    } finally {
      setRegistering(null);
    }
  };

  const isRegistered = (eventId: string) => {
    return registeredEvents.some((reg) => reg.event_id === eventId);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !('attendance_percentage' in user)) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold">Campus Event Connect</h1>
              <p className="text-blue-100 text-sm">Student Dashboard</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all duration-200"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User size={32} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Roll No</p>
                  <p className="font-semibold text-gray-800">{user.roll_no}</p>
                </div>
                <div>
                  <p className="text-gray-500">Department</p>
                  <p className="font-semibold text-gray-800">{user.dept}</p>
                </div>
                <div>
                  <p className="text-gray-500">Year</p>
                  <p className="font-semibold text-gray-800">{user.year}</p>
                </div>
                <div>
                  <p className="text-gray-500">Attendance</p>
                  <p
                    className={`font-semibold ${
                      user.attendance_percentage >= 70 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {user.attendance_percentage}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {user.attendance_percentage < 70 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-red-800">Low Attendance Warning</p>
                <p className="text-red-700 text-sm mt-1">
                  Your attendance is below 70%. You cannot register for events until your attendance
                  improves.
                </p>
              </div>
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="text-orange-600" size={24} />
              <h3 className="text-xl font-bold text-gray-800">Upcoming Events</h3>
            </div>
            <div className="space-y-3">
              {notifications.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{event.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString()} at {event.time}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                    {new Date(event.date).toDateString() === new Date().toDateString()
                      ? 'Today'
                      : 'Tomorrow'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-blue-600" size={24} />
              <h3 className="text-xl font-bold text-gray-800">Available Events</h3>
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow duration-200"
                >
                  <h4 className="text-lg font-bold text-gray-800 mb-2">{event.title}</h4>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{event.venue}</span>
                    </div>
                  </div>
                  {isRegistered(event.id) ? (
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle size={18} />
                      Registered
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegister(event)}
                      disabled={registering === event.id || user.attendance_percentage < 70}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registering === event.id ? 'Registering...' : 'Register'}
                    </button>
                  )}
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
                  No upcoming events available
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="text-blue-600" size={24} />
              <h3 className="text-xl font-bold text-gray-800">My Registered Events</h3>
            </div>
            <div className="space-y-4">
              {registeredEvents.map((registration) => (
                <div
                  key={registration.id}
                  className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600"
                >
                  <h4 className="text-lg font-bold text-gray-800 mb-2">
                    {registration.events.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {registration.events.description}
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{new Date(registration.events.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{registration.events.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{registration.events.venue}</span>
                    </div>
                  </div>
                </div>
              ))}
              {registeredEvents.length === 0 && (
                <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
                  You haven't registered for any events yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
