"use client";
import {createContext,ReactNode,useContext,useEffect,useMemo,useState} from "react";
type Theme="light"|"dark";const C=createContext<any>(null);
export function ThemeProvider({children}:{children:ReactNode}){const[theme,setThemeState]=useState<Theme>("light");useEffect(()=>{const saved=localStorage.getItem("operix_theme") as Theme|null;const next=saved==="dark"?"dark":"light";setThemeState(next);document.documentElement.classList.toggle("dark",next==="dark")},[]);const setTheme=(next:Theme)=>{setThemeState(next);localStorage.setItem("operix_theme",next);document.documentElement.classList.toggle("dark",next==="dark")};const v=useMemo(()=>({theme,setTheme,toggleTheme:()=>setTheme(theme==="dark"?"light":"dark")}),[theme]);return <C.Provider value={v}>{children}</C.Provider>}
export function useTheme(){const c=useContext(C);if(!c)throw new Error("useTheme outside provider");return c}
