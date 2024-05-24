import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import 'blockly/javascript';
import io from 'socket.io-client';
import { Box, Button, VStack, HStack, Text, useToast, ChakraProvider } from '@chakra-ui/react';
import { javascriptGenerator } from 'blockly/javascript';
import axios from 'axios';
import Output from '../Blocky/Output';
import Sidebar from '../Blocky/Sidebar';
import Navbar from '../LandingPage/Navbar';

const BlocklyComponent = () => {
  const blocklyDiv = useRef(null);
  const toolbox = useRef(null);
  const workspace = useRef(null);
  const socket = useRef(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedXml, setGeneratedXml] = useState('');
  const [output, setOutput] = useState('');
  const toast = useToast();
  const editorRef = useRef(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const userDataFromStorage = localStorage.getItem('user');
    if (userDataFromStorage) {
      const parsedUserData = JSON.parse(userDataFromStorage);
      setUserData(parsedUserData);
    }
  }, []);

  const userId = userData ? userData._id : null;
  const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
  });

  useEffect(() => {
    if (blocklyDiv.current && toolbox.current) {
      console.log('Initializing socket connection');
      socket.current = io('http://localhost:4000');

      socket.current.on('workspace-change', (data) => {
        if (workspace.current) {
          console.log('Received workspace-change data', data);
          const json = JSON.parse(data);
          Blockly.serialization.workspaces.load(json, workspace.current);
        }
      });

      console.log('Injecting Blockly workspace');
      workspace.current = Blockly.inject(blocklyDiv.current, {
        toolbox: toolbox.current,
      });

      workspace.current.addChangeListener(() => {
        const json = Blockly.serialization.workspaces.save(workspace.current);
        const jsonText = JSON.stringify(json);
        console.log('Emitting workspace-change', jsonText);
        socket.current.emit('workspace-change', jsonText);
        generateCode();
      });


    

      return () => {
        if (socket.current) {
          socket.current.disconnect();
        }
      };
    }
  }, [blocklyDiv, toolbox]);

  const generateCode = () => {
    if (workspace.current) {
      const code = javascriptGenerator.workspaceToCode(workspace.current);
      const xml = Blockly.Xml.workspaceToDom(workspace.current);
      const xmlText = Blockly.Xml.domToText(xml);
      setGeneratedCode(code);
      setGeneratedXml(xmlText);
    }
  };

  const saveCodeAndOutput = async () => {
    try {
      const response = await axiosInstance.post(
        '/blockly/blocklysave',
        {
          userId,
          generatedCode,
          output,
          xml: generatedXml,
        },
        {
          headers: {
            Authorization: 'Bearer ' + localStorage.getItem('auth_token'),
          },
        }
      );
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Code Saved to Database',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save code',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error saving code:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while saving code',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleFileClick = async (fileId) => {
    try {
      const response = await axiosInstance.get(`/file/${fileId}`);
      if (response.data && response.data.json) {
        const json = JSON.parse(response.data.json);
        Blockly.serialization.workspaces.load(json, workspace.current);
        setGeneratedCode(response.data.code);
        setOutput(response.data.output);
      }
    } catch (error) {
      console.error('Error loading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to load file',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const updateOutput = (newOutput) => {
    setOutput(newOutput);
  };

  return (
    <>
      <Navbar />
      <ChakraProvider>
        <Box display="flex" height="100vh" padding="10px" backgroundColor="gray.100">
          <xml style={{ display: 'none' }} ref={toolbox}>
          
            <category name="Loops" colour="%{BKY_LOOPS_HUE}" id="loopsCategory">
              <block type="controls_repeat_ext">
                <value name="TIMES">
                  <shadow type="math_number">
                    <field name="NUM">10</field>
                  </shadow>
                </value>
              </block>
              <block type="controls_whileUntil"></block>
              <block type="controls_for">
                <value name="FROM">
                  <shadow type="math_number">
                    <field name="NUM">1</field>
                  </shadow>
                </value>
                <value name="TO">
                  <shadow type="math_number">
                    <field name="NUM">10</field>
                  </shadow>
                </value>
                <value name="BY">
                  <shadow type="math_number">
                    <field name="NUM">1</field>
                  </shadow>
                </value>
              </block>
              <block type="controls_forEach"></block>
              <block type="controls_flow_statements"></block>
            </category>
            <category name="Math" colour="%{BKY_MATH_HUE}">
              <block type="math_number">
                <field name="NUM">123</field>
              </block>
              <block type="math_arithmetic">
                <value name="A">
                  <shadow type="math_number">
                    <field name="NUM">1</field>
                  </shadow>
                </value>
                <value name="B">
                  <shadow type="math_number">
                    <field name="NUM">1</field>
                  </shadow>
                </value>
              </block>
              <block type="math_single">
                <value name="NUM">
                  <shadow type="math_number">
                    <field name="NUM">9</field>
                  </shadow>
                </value>
              </block>
              <block type="math_trig">
                <value name="NUM">
                  <shadow type="math_number">
                    <field name="NUM">45</field>
                  </shadow>
                </value>
              </block>
              <block type="math_constant"></block>
              <block type="math_number_property">
                <value name="NUMBER_TO_CHECK">
                  <shadow type="math_number">
                    <field name="NUM">0</field>
                  </shadow>
                </value>
              </block>
              <block type="math_round">
                <value name="NUM">
                  <shadow type="math_number">
                    <field name="NUM">3.1</field>
                  </shadow>
                </value>
              </block>
              <block type="math_on_list"></block>
              <block type="math_modulo">
                <value name="DIVIDEND">
                  <shadow type="math_number">
                    <field name="NUM">64</field>
                  </shadow>
                </value>
                <value name="DIVISOR">
                  <shadow type="math_number">
                    <field name="NUM">10</field>
                  </shadow>
                </value>
              </block>
              <block type="math_constrain">
                <value name="VALUE">
                  <shadow type="math_number">
                    <field name="NUM">50</field>
                  </shadow>
                </value>
                <value name="LOW">
                  <shadow type="math_number">
                    <field name="NUM">1</field>
                  </shadow>
                </value>
                <value name="HIGH">
                  <shadow type="math_number">
                    <field name="NUM">100</field>
                  </shadow>
                </value>
              </block>
              <block type="math_random_int">
                <value name="FROM">
                  <shadow type="math_number">
                    <field name="NUM">1</field>
                  </shadow>
                </value>
                <value name="TO">
                  <shadow type="math_number">
                    <field name="NUM">100</field>
                  </shadow>
                </value>
              </block>
              <block type="math_random_float"></block>
              <block type="math_atan2">
                <value name="X">
                  <shadow type="math_number">
                    <field name="NUM">1</field>
                  </shadow>
                </value>
                <value name="Y">
                  <shadow type="math_number">
                    <field name="NUM">1</field>
                  </shadow>
                </value>
              </block>
            </category>
            <category name="Text" colour="%{BKY_TEXTS_HUE}">
              <block type="text"></block>
              <block type="text_join"></block>
              <block type="text_append">
                <value name="TEXT">
                  <shadow type="text"></shadow>
                </value>
              </block>
              <block type="text_length">
                <value name="VALUE">
                  <shadow type="text"></shadow>
                </value>
              </block>
              <block type="text_isEmpty">
                <value name="VALUE">
                  <shadow type="text"></shadow>
                </value>
              </block>
              <block type="text_indexOf">
                <value name="VALUE">
                  <block type="variables_get">
                    <field name="VAR">{'textVariable'}</field>
                  </block>
                </value>
              </block>
              <block type="text_charAt">
                <value name="VALUE">
                  <shadow type="text"></shadow>
                </value>
              </block>
              <block type="text_getSubstring">
                <value name="STRING">
                  <shadow type="text"></shadow>
                </value>
              </block>
              <block type="text_changeCase">
                <value name="TEXT">
                  <shadow type="text"></shadow>
                </value>
              </block>
              <block type="text_trim">
                <value name="TEXT">
                  <shadow type="text"></shadow>
                </value>
              </block>
              <block type="text_print">
                <value name="TEXT">
                  <shadow type="text"></shadow>
                </value>
              </block>
              <block type="text_prompt_ext">
                <value name="TEXT">
                  <shadow type="text"></shadow>
                </value>
              </block>
            </category>
            <category name="Variables" custom="VARIABLE" colour="%{BKY_VARIABLES_HUE}"></category>
            <category name="Functions" custom="PROCEDURE" colour="%{BKY_PROCEDURES_HUE}"></category>
          </xml>
          <div ref={blocklyDiv} style={{ flex: 1 }} />
          <VStack flex="1" padding="10px" spacing="10px">
            <HStack spacing="10px">
              <Button colorScheme="blue" onClick={generateCode}>
                Generate Code
              </Button>
              <Button colorScheme="green" onClick={saveCodeAndOutput}>
                Save
              </Button>
            </HStack>
            <Box
              width="100%"
              padding="10px"
              backgroundColor="gray.200"
              borderRadius="md"
              overflowY="auto"
              height="300px"
            >
              <Text fontFamily="monospace">{generatedCode}</Text>
            </Box>
            <Box width="100%" marginTop="20px">
              <Text fontSize="lg" fontWeight="bold">
                Output:
              </Text>
              <Box
                width="100%"
                padding="10px"
                backgroundColor="gray.200"
                borderRadius="md"
                overflowY="auto"
                maxHeight="300px"
              >
                <Output
                  language="javascript"
                  code={generatedCode}
                  output={output}
                  setOutput={updateOutput}
                  editorRef={editorRef}
                />
              </Box>
            </Box>
          </VStack>
          <Sidebar onFileClick={handleFileClick} />
   
        </Box>
      </ChakraProvider>
    </>
  );
};

export default BlocklyComponent;