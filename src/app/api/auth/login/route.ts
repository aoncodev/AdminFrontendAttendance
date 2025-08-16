import { type NextRequest, NextResponse } from "next/server";

interface LoginRequest {
  email: string;
  password: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

// Mock user data - replace with actual database lookup
const mockUsers: (User & { password: string })[] = [
  {
    id: 1,
    email: "admin@restaurant.com",
    password: "demo123",
    name: "Admin User",
    role: "admin",
  },
  {
    id: 2,
    email: "manager@restaurant.com",
    password: "manager123",
    name: "Restaurant Manager",
    role: "manager",
  },
];

// Mock JWT token generation - replace with actual JWT library
function generateMockToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
  };

  // In production, use a proper JWT library like 'jsonwebtoken'
  return `mock_jwt_token_${Buffer.from(JSON.stringify(payload)).toString(
    "base64"
  )}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    // Validate input
    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email and password are required",
          },
        },
        { status: 400 }
      );
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Find user by email
    const user = mockUsers.find(
      (u) => u.email.toLowerCase() === body.email.toLowerCase()
    );

    if (!user || user.password !== body.password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateMockToken(user);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: userWithoutPassword,
        expires_at: expiresAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
