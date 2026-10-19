"use client";
import {createContext} from "react";
export const NextLearningActivity=createContext<{go:()=>void;label:string}|undefined>(undefined);
