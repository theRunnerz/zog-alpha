import '../styles/globals.css';
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
useEffect(() => {
  const setVh = () => {
    document.documentElement.style.setProperty(
      "--vh",
      `${window.innerHeight * 0.01}px`
    )
  }
  setVh()
  window.addEventListener("resize", setVh)
  return () => window.removeEventListener("resize", setVh)
}, [])
