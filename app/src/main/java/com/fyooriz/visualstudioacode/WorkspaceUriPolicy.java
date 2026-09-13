package com.fyooriz.visualstudioacode;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;

/** WorkspaceCore boundary that keeps SAF document operations inside the selected tree. */
public final class WorkspaceUriPolicy {
    private WorkspaceUriPolicy() {}

    public static void requireWithinWorkspace(String workspaceTreeUri, String targetUri) throws SecurityException {
        if (!isWithinWorkspace(workspaceTreeUri, targetUri)) {
            throw new SecurityException("Workspace URI is outside the selected workspace");
        }
    }

    public static boolean isValidTreeUri(String workspaceTreeUri) {
        if (workspaceTreeUri == null || workspaceTreeUri.isBlank()) return false;
        try {
            URI tree = new URI(workspaceTreeUri);
            if (!"content".equalsIgnoreCase(tree.getScheme())) return false;
            if (tree.getRawAuthority() == null || tree.getRawAuthority().isBlank()) return false;
            if (tree.getRawQuery() != null || tree.getRawFragment() != null) return false;
            String treePath = canonicalPath(tree.getRawPath(), true);
            return treePath != null && treePath.startsWith("/tree/") && treePath.length() > "/tree/".length();
        } catch (URISyntaxException ignored) {
            return false;
        }
    }

    public static boolean isWithinWorkspace(String workspaceTreeUri, String targetUri) {
        if (!isValidTreeUri(workspaceTreeUri) || targetUri == null || targetUri.isBlank()) return false;
        try {
            URI tree = new URI(workspaceTreeUri);
            URI target = new URI(targetUri);
            if (!"content".equalsIgnoreCase(target.getScheme())) return false;
            if (target.getRawAuthority() == null || !tree.getRawAuthority().equals(target.getRawAuthority())) return false;
            if (target.getRawQuery() != null || target.getRawFragment() != null) return false;

            String treePath = canonicalPath(tree.getRawPath(), true);
            String targetPath = canonicalPath(target.getRawPath(), false);
            if (treePath == null || targetPath == null) return false;
            if (!targetPath.equals(treePath) && !targetPath.startsWith(treePath.endsWith("/") ? treePath : treePath + "/")) {
                return false;
            }
            return targetPath.equals(treePath)
                    || targetPath.startsWith(treePath + "/document/")
                    || targetPath.startsWith(treePath + "/children/");
        } catch (URISyntaxException ignored) {
            return false;
        }
    }

    private static String canonicalPath(String rawPath, boolean tree) {
        if (rawPath == null || rawPath.isBlank()) return null;
        String lower = rawPath.toLowerCase(Locale.ROOT);
        if (lower.contains("%2f") || lower.contains("%5c") || lower.contains("%00") || rawPath.indexOf('\\') >= 0) return null;
        String decoded = decode(rawPath);
        if (decoded == null || decoded.indexOf('\0') >= 0 || decoded.indexOf('\\') >= 0) return null;
        String[] segments = decoded.split("/");
        StringBuilder normalized = new StringBuilder();
        for (String segment : segments) {
            if (segment.isEmpty()) continue;
            if (".".equals(segment) || "..".equals(segment)) return null;
            normalized.append('/').append(segment);
        }
        String result = normalized.length() == 0 ? "/" : normalized.toString();
        if (tree && !result.startsWith("/tree/")) return null;
        return result;
    }

    private static String decode(String rawPath) {
        StringBuilder out = new StringBuilder(rawPath.length());
        for (int i = 0; i < rawPath.length(); i++) {
            char c = rawPath.charAt(i);
            if (c != '%') {
                out.append(c);
                continue;
            }
            if (i + 2 >= rawPath.length()) return null;
            int hi = Character.digit(rawPath.charAt(i + 1), 16);
            int lo = Character.digit(rawPath.charAt(i + 2), 16);
            if (hi < 0 || lo < 0) return null;
            out.append((char) ((hi << 4) | lo));
            i += 2;
        }
        return out.toString();
    }
}
