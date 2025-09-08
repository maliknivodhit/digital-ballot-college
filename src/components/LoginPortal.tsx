import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, User, UserPlus, LogIn, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";

export const LoginPortal = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    studentId: "",
    department: "",
    yearOfStudy: "",
    passcode: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isAdmin && formData.email === "nivodhitmalik@gmail.com" && formData.password === "Malik#201") {
        // Special hardcoded admin login
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: "admin123",
        });

        if (error) {
          // Create admin account if it doesn't exist
          const { error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
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
      } else {
        // Regular login
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "Login Successful!",
          description: `Welcome ${isAdmin ? "Admin" : "Student"}!`,
        });
      }
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

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (isAdmin && formData.passcode !== "654321") {
      toast({
        title: "Invalid Passcode",
        description: "The admin passcode is incorrect",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const signUpData = {
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: isAdmin 
            ? {
                full_name: formData.fullName,
                role: "admin",
              }
            : {
                full_name: formData.fullName,
                student_id: formData.studentId,
                department: formData.department,
                year_of_study: parseInt(formData.yearOfStudy),
              },
        },
      };

      const { error } = await supabase.auth.signUp(signUpData);

      if (error) throw error;

      toast({
        title: "Registration Successful!",
        description: "Please check your email to verify your account, then you can login!",
      });

      // Reset form
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        studentId: "",
        department: "",
        yearOfStudy: "",
        passcode: "",
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
            <CardTitle className="text-center">
              {isRegister ? "Create Account" : "Sign In"}
            </CardTitle>
            <CardDescription className="text-center">
              {isRegister ? "Register to participate in elections" : "Access your voting portal"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Login/Register Toggle */}
            <Tabs value={isRegister ? "register" : "login"} onValueChange={(value) => setIsRegister(value === "register")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {/* Admin/Student Toggle for Login */}
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Label htmlFor="admin-toggle" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Student
                  </Label>
                  <Switch
                    id="admin-toggle"
                    checked={isAdmin}
                    onCheckedChange={setIsAdmin}
                  />
                  <Label htmlFor="admin-toggle" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Label>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={isAdmin ? "Enter admin email" : "Enter your student email"}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter your password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    <LogIn className="mr-2 h-4 w-4" />
                    {loading ? "Signing in..." : `Sign in as ${isAdmin ? "Admin" : "Student"}`}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                {/* Admin/Student Toggle for Registration */}
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Label htmlFor="admin-register-toggle" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Student
                  </Label>
                  <Switch
                    id="admin-register-toggle"
                    checked={isAdmin}
                    onCheckedChange={setIsAdmin}
                  />
                  <Label htmlFor="admin-register-toggle" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Label>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  {isAdmin && (
                    <div>
                      <Label htmlFor="passcode">Admin Passcode</Label>
                      <Input
                        id="passcode"
                        type="password"
                        value={formData.passcode}
                        onChange={(e) => setFormData({ ...formData, passcode: e.target.value })}
                        placeholder="Enter admin passcode (654321)"
                        required
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  {!isAdmin && (
                    <>
                      <div>
                        <Label htmlFor="studentId">Student ID</Label>
                        <Input
                          id="studentId"
                          value={formData.studentId}
                          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                          placeholder="Enter your student ID"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          placeholder="e.g., Computer Science"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="yearOfStudy">Year of Study</Label>
                        <Input
                          id="yearOfStudy"
                          type="number"
                          min="1"
                          max="5"
                          value={formData.yearOfStudy}
                          onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                          placeholder="1-5"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="registerEmail">Email</Label>
                    <Input
                      id="registerEmail"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="registerPassword">Password</Label>
                    <div className="relative">
                      <Input
                        id="registerPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Create a secure password (min 6 chars)"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {isAdmin ? <Shield className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    {loading ? "Creating account..." : `Register as ${isAdmin ? "Admin" : "Student"}`}
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