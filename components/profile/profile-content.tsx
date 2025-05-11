"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { User, LogOut, Edit, Save, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

type UserProfile = {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at?: string
  google_api_key?: string
  alpha_vantage_key?: string
}

export function ProfileContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    google_api_key: "",
    alpha_vantage_key: ""
  })
  
  const router = useRouter()
  const supabase = createClient()
  
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("Session error:", sessionError.message)
          throw sessionError
        }
        
        if (!session) {
          console.log("No active session found")
          router.push("/login")
          return
        }
        
        console.log("Session found, user ID:", session.user.id)
        
        const { data: profilesData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
        
        if (error) {
          console.error("Supabase error fetching profile:", error.message, error.details, error.hint)
          throw error
        }
        
        if (!profilesData || profilesData.length === 0) {
          console.error("No profile data found for user", session.user.id)
          toast.error("No profile found. Please contact support or try signing up again.")
          return
        } else if (profilesData.length > 1) {
          console.warn("Multiple profiles found for user", session.user.id, ". Using the first one.")
        }
        
        const profileData = profilesData[0]
        
        console.log("Profile data retrieved successfully")
        setProfile(profileData as UserProfile)
        setFormData({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          phone: profileData.phone || "",
          google_api_key: profileData.google_api_key || "",
          alpha_vantage_key: profileData.alpha_vantage_key || ""
        })
      } catch (error) {
        console.error("Error fetching profile:", error)
        if (error instanceof Error) {
          console.error("Error details:", error.message)
          toast.error(`Failed to load profile: ${error.message}`)
        } else {
          toast.error("Failed to load profile data")
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProfile()
  }, [supabase, router])
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success("Successfully logged out")
      window.location.href = "/login"
    } catch (error) {
      console.error("Error logging out:", error)
      toast.error("Failed to log out")
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }
  
  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile?.id)
        .select()
      
      if (error) {
        throw error
      }
      
      setProfile(data[0] as UserProfile)
      setIsEditing(false)
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        google_api_key: profile.google_api_key || "",
        alpha_vantage_key: profile.alpha_vantage_key || ""
      })
    }
    setIsEditing(false)
  }
  
  const getInitials = () => {
    if (!profile) return "?"
    return `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase()
  }
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleLogout} 
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </Button>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="account">Account Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-full max-w-md" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full max-w-md" />
                  <Skeleton className="h-10 w-full max-w-md" />
                  <Skeleton className="h-10 w-full max-w-md" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Manage your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <Avatar className="h-20 w-20 border-2 border-primary/20">
                    {profile?.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} />
                    ) : (
                      <AvatarFallback className="text-xl bg-primary/10 text-primary">
                        {getInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="space-y-1">
                    <h3 className="text-xl font-medium">
                      {profile?.first_name} {profile?.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Member since {new Date(profile?.created_at || "").toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input 
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input 
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Optional"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Button onClick={handleUpdateProfile} disabled={isLoading} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">First Name</p>
                        <p className="font-medium">{profile?.first_name || "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Last Name</p>
                        <p className="font-medium">{profile?.last_name || "-"}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Email Address</p>
                      <p className="font-medium">{profile?.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                      <p className="font-medium">{profile?.phone || "-"}</p>
                    </div>
                    
                    <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences and security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Change your password to keep your account secure
                  </p>
                </div>
                <Button variant="outline">Change Password</Button>
                <Separator className="my-4" />
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">API Keys</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your Google API Key and Alpha Vantage API Key for personalized access.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="google_api_key">Google API Key</Label>
                    <Input
                      id="google_api_key"
                      name="google_api_key"
                      type="password"
                      value={formData.google_api_key || profile?.google_api_key || ""}
                      onChange={e => setFormData({ ...formData, google_api_key: e.target.value })}
                      placeholder="Enter your Google API Key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alpha_vantage_key">Alpha Vantage API Key</Label>
                    <Input
                      id="alpha_vantage_key"
                      name="alpha_vantage_key"
                      type="password"
                      value={formData.alpha_vantage_key || profile?.alpha_vantage_key || ""}
                      onChange={e => setFormData({ ...formData, alpha_vantage_key: e.target.value })}
                      placeholder="Enter your Alpha Vantage API Key"
                    />
                  </div>
                  <Button 
                    onClick={async () => {
                      try {
                        setIsLoading(true);
                        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                        if (sessionError || !session) throw new Error('User session not found. Please log in again.');
                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/api-keys`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                          },
                          body: JSON.stringify({
                            googleApiKey: formData.google_api_key || profile?.google_api_key || "",
                            alphaVantageKey: formData.alpha_vantage_key || profile?.alpha_vantage_key || ""
                          }),
                        });
                        const result = await response.json();
                        if (!response.ok || !result.success) throw new Error(result.message || 'Failed to save API keys.');
                        toast.success('API keys updated successfully.');
                        setProfile((prev: any) => ({ ...prev, google_api_key: formData.google_api_key, alpha_vantage_key: formData.alpha_vantage_key }));
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to update API keys.');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save API Keys
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6 py-4">
              <div className="space-y-2">
                <h4 className="font-medium">Account Actions</h4>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Log Out of All Devices
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}