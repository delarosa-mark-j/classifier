// import logo from './logo.svg';
// import React, {useReducer, useState, useRef} from 'react';
// import * as mobilenet from '@tensorflow-models/mobilenet'
// import './App.css';

// const stateMachine = {
//   initial: 'initial',
//   states: {
//     initial: { on: { next: 'loadingModel'} },
//     loadingModel: { on: { next: "awaitingUpload"} },
//     awaitingUpload: { on: { next: "ready"} },
//     ready: { on: { next: "classifying"}, showImage: true },
//     classifying: { on: { next: "complete"} },
//     complete: { on: { next: "awaitingUpload"}, showImage: true }
//   }
// }

// const reducer = (currentState, event) => stateMachine.states[currentState].on[event] || stateMachine.initial;


// function App() {
//   const [state, dispatch] = useReducer(reducer, stateMachine.initial);
//   const [model, setModel] = useState(null);
//   const inputRef = useRef();
//   const imageRef = useRef();
//   const [imageUrl, setImageUrl] = useState(null);
//   const next = () => dispatch('next');

//   const loadModel = async () => {
//     next();
//     const mobilenetModel = await mobilenet.load();
//     setModel(mobilenetModel);
//     next();
//   };

//   const handleUpload = event => {
//     const {files} = event.target;
//     if (files.length > 0 ){
//       const url = URL.createObjectURL(files[0]);
//       setImageUrl(url);
//       next();
//     }
//   }

//   const buttonProps = {
//     initial: { text: 'Load Model', action: loadModel},
//     loadingModel: { text: 'Loading Model...',action: () => {}},
//     awaitingUpload: { text: 'Upload Photo', action: () => inputRef.current.click()},
//     ready: { text: 'Identify', action: () => {}},
//     classifying: { text: 'Identifying', action: () => {}},
//     complete: { text: 'Reset', action: () => {}}
//   }

//   const { showImage = false } = stateMachine.states[state];

//   return (
//     <div>
//       {showImage && <img atl="upload-preview" scr={imageUrl} ref={imageRef}/>}
//       <input type = "file" accept = "image/*" capture="camera" ref = {inputRef} onChange={handleUpload}/>
//       <button onClick={buttonProps[state].action}>{buttonProps[state].text}</button>
//     </div>
//   );
// }

// export default App;

  
import React, { useState, useRef, useReducer } from "react";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from '@tensorflow/tfjs'
import "./App.css";

const machine = {
  initial: "initial",
  states: {
    initial: { on: { next: "loadingModel" } },
    loadingModel: { on: { next: "modelReady" } },
    modelReady: { on: { next: "imageReady" } },
    imageReady: { on: { next: "identifying" }, showImage: true },
    identifying: { on: { next: "complete" } },
    complete: { on: { next: "modelReady" }, showImage: true, showResults: true }
  }
};

function App() {
  tf.setBackend("cpu")
  const [results, setResults] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const [model, setModel] = useState(null);
  const imageRef = useRef();
  const inputRef = useRef();

  const reducer = (state, event) =>
    machine.states[state].on[event] || machine.initial;

  const [appState, dispatch] = useReducer(reducer, machine.initial);
  const next = () => dispatch("next");

  const loadModel = async () => {
    next();
    const model = await mobilenet.load();
    setModel(model);
    next();
  };

  const identify = async () => {
    next();
    const results = await model.classify(imageRef.current);
    setResults(results);
    next();
  };

  const reset = async () => {
    setResults([]);
    next();
  };

  const upload = () => inputRef.current.click();

  const handleUpload = event => {
    const { files } = event.target;
    if (files.length > 0) {
      const url = URL.createObjectURL(event.target.files[0]);
      setImageURL(url);
      next();
    }
  };

  const actionButton = {
    initial: { action: loadModel, text: "Load Model" },
    loadingModel: { text: "Loading Model..." },
    modelReady: { action: upload, text: "Upload Image" },
    imageReady: { action: identify, text: "Identify Breed" },
    identifying: { text: "Identifying..." },
    complete: { action: reset, text: "Reset" }
  };

  const { showImage, showResults } = machine.states[appState];

  return (
    <div>
      {showImage && <img src={imageURL} alt="upload-preview" ref={imageRef} />}
      <input
        type="file"
        accept="image/*"
        capture="camera"
        onChange={handleUpload}
        ref={inputRef}
      />
      {showResults && (
        <ul>
          {results.map(({ className, probability }) => (
            <li key={className}>{`${className}: %${(probability * 100).toFixed(
              2
            )}`}</li>
          ))}
        </ul>
      )}
      <button onClick={actionButton[appState].action || (() => {})}>
        {actionButton[appState].text}
      </button>
    </div>
  );
}

export default App;