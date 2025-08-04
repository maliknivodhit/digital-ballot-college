import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Vote, Calendar, Users, BarChart3, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ElectionManagement } from "./admin/ElectionManagement";
import { CandidateManagement } from "./admin/CandidateManagement";
import { VotingInterface } from "./voting/VotingInterface";

interface Election {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface UserProfile {
  student_id: string;
  full_name: string;
  department: string;
  year_of_study: number;
}

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { role, isAdmin } = useRole();
  const { toast } = useToast();
  const [elections, setElections] = useState<Election[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminView, setAdminView] = useState<"elections" | "candidates" | "results">("elections");

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
      } else {
        setProfile(profileData);
      }

      // Fetch active elections
      const { data: electionsData, error: electionsError } = await supabase
        .from("elections")
        .select("*")
        .eq("is_active", true)
        .order("start_time", { ascending: true });

      if (electionsError) {
        console.error("Elections fetch error:", electionsError);
      } else {
        setElections(electionsData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const isElectionActive = (election: Election) => {
    const now = new Date();
    const startTime = new Date(election.start_time);
    const endTime = new Date(election.end_time);
    return now >= startTime && now <= endTime;
  };

  const getElectionStatus = (election: Election) => {
    const now = new Date();
    const startTime = new Date(election.start_time);
    const endTime = new Date(election.end_time);

    if (now < startTime) return "upcoming";
    if (now > endTime) return "ended";
    return "active";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Digital Ballot College</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name || user?.email} {isAdmin && <Badge variant="secondary">Admin</Badge>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button 
                variant={showAdminPanel ? "default" : "outline"} 
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {showAdminPanel ? "Student View" : "Admin Panel"}
              </Button>
            )}
            <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Admin Panel */}
        {isAdmin && showAdminPanel ? (
          <div className="space-y-6">
            <div className="flex gap-2 border-b">
              <Button 
                variant={adminView === "elections" ? "default" : "ghost"}
                onClick={() => setAdminView("elections")}
              >
                Elections
              </Button>
              <Button 
                variant={adminView === "candidates" ? "default" : "ghost"}
                onClick={() => setAdminView("candidates")}
              >
                Candidates
              </Button>
              <Button 
                variant={adminView === "results" ? "default" : "ghost"}
                onClick={() => setAdminView("results")}
              >
                Results
              </Button>
            </div>
            
            {adminView === "elections" && <ElectionManagement />}
            {adminView === "candidates" && <CandidateManagement />}
            {adminView === "results" && <div>Results view coming soon...</div>}
          </div>
        ) : (
          <>
            {/* Student Dashboard Content */}
        {/* Profile Card */}
        {profile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Student ID</p>
                <p className="font-medium">{profile.student_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{profile.department}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Year of Study</p>
                <p className="font-medium">{profile.year_of_study}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voting Section */}
        <VotingInterface />

        {/* Elections Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Available Elections
            </CardTitle>
            <CardDescription>
              Participate in active student elections and view upcoming events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {elections.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Elections</h3>
                <p className="text-muted-foreground">
                  There are currently no active elections. Check back later for upcoming elections.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {elections.map((election) => {
                  const status = getElectionStatus(election);
                  const isActive = isElectionActive(election);
                  
                  return (
                    <Card key={election.id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{election.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {election.description}
                            </CardDescription>
                          </div>
                          <Badge 
                            variant={
                              status === "active" ? "default" : 
                              status === "upcoming" ? "secondary" : "outline"
                            }
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                          <span>
                            Starts: {new Date(election.start_time).toLocaleString()}
                          </span>
                          <span>
                            Ends: {new Date(election.end_time).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            disabled={!isActive}
                            className="flex items-center gap-2"
                          >
                            <Vote className="h-4 w-4" />
                            {isActive ? "Vote Now" : "Voting Closed"}
                          </Button>
                          <Button variant="outline" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            View Results
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="text-center">
                  <Vote className="h-8 w-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">My Votes</CardTitle>
                  <CardDescription>View your voting history</CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="text-center">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">Candidates</CardTitle>
                  <CardDescription>View candidate profiles</CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="text-center">
                  <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">Results</CardTitle>
                  <CardDescription>Election results & analytics</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};