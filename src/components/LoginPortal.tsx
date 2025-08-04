import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, User, UserPlus, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const LoginPortal = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("voter");

  // Admin login form
  const [adminForm, setAdminForm] = useState({
    email: "",
    password: "",
  });

  // Voter login form
  const [voterForm, setVoterForm] = useState({
    email: "",
    password: "",
  });

  // Registration form
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    studentId: "",
    department: "",
    yearOfStudy: "",
    password: "",
    confirmPassword: "",
  });

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check hardcoded admin credentials
    if (adminForm.email === "nivodhitmalik@gmail.com" && adminForm.password === "Malik#201") {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: adminForm.email,
          password: "admin123", // Use a standard password for Supabase auth
        });

        if (error) {
          // If admin doesn't exist in Supabase, create them
          const { error: signUpError } = await supabase.auth.signUp({
            email: adminForm.email,
            password: "admin123",
            options: {
              emailRedirectTo: `${window.location.origin}/`,
            },
          });

          if (signUpError) throw signUpError;

          toast({
            title: "Admin account created",
            description: "Please check your email and verify your account, then login again.",
          });
        } else {
          toast({
            title: "Login successful",
            description: "Welcome Admin!",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Invalid Credentials",
        description: "Admin email or password is incorrect",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleVoterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: voterForm.email,
        password: voterForm.password,
      });

      if (error) throw error;

      toast({
        title: "Login Successful!",
        description: "Welcome to the voting portal",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (registerForm.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: registerForm.email,
        password: registerForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: registerForm.fullName,
            student_id: registerForm.studentId,
            department: registerForm.department,
            year_of_study: parseInt(registerForm.yearOfStudy),
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Registration Successful!",
        description: "Please check your email to verify your account, then you can login and vote!",
      });

      // Reset form
      setRegisterForm({
        fullName: "",
        email: "",
        studentId: "",
        department: "",
        yearOfStudy: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  if (user) {
    return null; // User is already logged in, will be redirected by App.tsx
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">College Online Polling System</h1>
          <p className="text-muted-foreground">Secure digital voting for students</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Welcome to Voting Portal</CardTitle>
            <CardDescription className="text-center">
              Select your role to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="admin" className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="voter" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Voter
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-1">
                  <UserPlus className="h-4 w-4" />
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      placeholder="Enter admin email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    <LogIn className="mr-2 h-4 w-4" />
                    {loading ? "Logging in..." : "Admin Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="voter">
                <form onSubmit={handleVoterLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="voter-email">Student Email</Label>
                    <Input
                      id="voter-email"
                      type="email"
                      value={voterForm.email}
                      onChange={(e) => setVoterForm({ ...voterForm, email: e.target.value })}
                      placeholder="Enter your student email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="voter-password">Password</Label>
                    <Input
                      id="voter-password"
                      type="password"
                      value={voterForm.password}
                      onChange={(e) => setVoterForm({ ...voterForm, password: e.target.value })}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    <LogIn className="mr-2 h-4 w-4" />
                    {loading ? "Logging in..." : "Voter Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      value={registerForm.fullName}
                      onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="student-id">Student ID</Label>
                    <Input
                      id="student-id"
                      value={registerForm.studentId}
                      onChange={(e) => setRegisterForm({ ...registerForm, studentId: e.target.value })}
                      placeholder="Enter your student ID"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={registerForm.department}
                      onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}
                      placeholder="e.g., Computer Science"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year of Study</Label>
                    <Input
                      id="year"
                      type="number"
                      min="1"
                      max="5"
                      value={registerForm.yearOfStudy}
                      onChange={(e) => setRegisterForm({ ...registerForm, yearOfStudy: e.target.value })}
                      placeholder="1-5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Create Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      placeholder="Create a secure password"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {loading ? "Registering..." : "Register as Voter"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};