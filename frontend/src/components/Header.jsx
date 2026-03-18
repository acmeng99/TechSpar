import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-card)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: "var(--text)",
  },
  nav: {
    display: "flex",
    gap: 8,
  },
  navBtn: {
    padding: "6px 16px",
    borderRadius: 8,
    background: "transparent",
    color: "var(--text-dim)",
    fontSize: 14,
    transition: "all 0.2s",
  },
  navBtnActive: {
    background: "var(--bg-hover)",
    color: "var(--text)",
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "var(--bg-hover)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    cursor: "pointer",
    transition: "all 0.2s",
    marginLeft: 8,
  },
};

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");
  const isActive = (path) => location.pathname === path;

  return (
    <header style={styles.header}>
      <div style={styles.logo} onClick={() => navigate("/")}>
        <div style={styles.logoIcon}>M</div>
        <span style={styles.title}>MockInterview</span>
      </div>
      <nav style={styles.nav}>
        <button
          style={{ ...styles.navBtn, ...(isActive("/") ? styles.navBtnActive : {}) }}
          onClick={() => navigate("/")}
        >
          首页
        </button>
        <button
          style={{ ...styles.navBtn, ...(isActive("/profile") ? styles.navBtnActive : {}) }}
          onClick={() => navigate("/profile")}
        >
          我的画像
        </button>
        <button
          style={{ ...styles.navBtn, ...(isActive("/knowledge") ? styles.navBtnActive : {}) }}
          onClick={() => navigate("/knowledge")}
        >
          题库
        </button>
        <button
          style={{ ...styles.navBtn, ...(isActive("/history") ? styles.navBtnActive : {}) }}
          onClick={() => navigate("/history")}
        >
          历史记录
        </button>
        <button style={styles.themeBtn} onClick={toggleTheme} title={theme === "dark" ? "切换亮色" : "切换暗色"}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </nav>
    </header>
  );
}
