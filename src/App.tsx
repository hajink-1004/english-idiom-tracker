import Prototype from './Prototype';
import {previewWidth} from './qa';
// User-requested native browser surface: no phone frame or simulated OS chrome.
export default function App() { return <div className="app-surface" style={previewWidth ? {width:previewWidth,margin:'0 auto'}:undefined}><Prototype /></div>; }
