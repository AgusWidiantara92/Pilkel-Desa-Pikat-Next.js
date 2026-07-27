import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pilkel-desa-pikat-secret-key-2026'
)
const COOKIE_NAME = 'pilkel_session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page, public routes, and static assets
  if (
    pathname === '/admin/login' ||
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    /\.(?:ico|png|jpg|jpeg|svg|css|js)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const role = payload.role as string

      // Only admin & panitia can access admin panel
      if (!['admin', 'panitia'].includes(role)) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      // Only admin can access /admin/users
      if (pathname.startsWith('/admin/users') && role !== 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }

      return NextResponse.next()
    } catch {
      // Invalid token, redirect to login
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete(COOKIE_NAME)
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
