'''
Author: linqibin
Date: 2025-06-30 08:58:01
LastEditors: linqibin
LastEditTime: 2025-09-04 17:51:59
Description: 

Copyright (c) 2025 by 智慧空间研究院/金地空间科技, All Rights Reserved. 
'''
from langchain_community.document_loaders import PyPDFLoader
from langchain_experimental.text_splitter import SemanticChunker
from pprint import pprint

loader = PyPDFLoader(file_path='../documents/data.pdf', mode='page')
rst = loader.load()
for r in rst:
    pprint(r.page_content)

