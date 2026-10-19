import {it,expect} from "vitest";
import {folders,libraryFolder,libraryExtension,validLibraryBytes,canManageLibrary} from "../src/lib/traveller-library";
const bytes=(s:string)=>new TextEncoder().encode(s);
it("retains every supplied resource entry in eight level folders",()=>{expect(folders).toHaveLength(8);expect(folders.reduce((n,f)=>n+f.resources.length,0)).toBe(49);expect(folders.flatMap(f=>f.resources).filter(r=>r.url)).toHaveLength(48);});
it("retains missing and duplicate URLs without inventing replacements",()=>{expect(libraryFolder("b1-plus")!.resources.find(r=>r.title==="Teacher's book")!.url).toBeNull();const c1=libraryFolder("c1")!.resources;expect(c1[4].url).toBe(c1[5].url);});
it("rejects traversal folder names and executable filenames",()=>{expect(libraryFolder("../beginners")).toBeUndefined();expect(libraryExtension("setup.exe")).toBeNull();expect(libraryExtension("file.pdf.exe")).toBeNull();});
it("checks file contents rather than trusting an extension",()=>{expect(validLibraryBytes("pdf",bytes("%PDF-1.7"))).toBe(true);expect(validLibraryBytes("pdf",bytes("MZ executable"))).toBe(false);expect(validLibraryBytes("zip",new Uint8Array([80,75,3,4]))).toBe(true);expect(validLibraryBytes("wav",bytes("RIFF0000WAVE"))).toBe(true);expect(validLibraryBytes("wav",bytes("RIFF0000FAKE"))).toBe(false);});
it("only grants library privileges to administrators",()=>{expect(canManageLibrary(["student","teacher"])).toBe(false);expect(canManageLibrary([])).toBe(false);expect(canManageLibrary(["admin"])).toBe(true);expect(canManageLibrary(["super_admin"])).toBe(true);});
