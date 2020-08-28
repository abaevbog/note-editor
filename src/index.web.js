import React from 'react';
import ReactDOM from 'react-dom';

import Editor from './ui/editor'
import EditorCore from './core/editor-core';

import { imageStore, citationStore } from './index.web.data';
import { generateObjectKey } from './core/utils';

var beautify = require('js-beautify').html;

// Notice: This fails to fetch the image if the host has
// CORS restrictions
async function loadImageAsDataUrl(url) {
  let blob = await fetch(url).then(r => r.blob());
  return await new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function importImage(src) {
  if (!src) return null;
  if (src.startsWith('data:')) {

  }
  else {
    src = await loadImageAsDataUrl(src);
  }

  let attachmentKey = generateObjectKey();

  imageStore[attachmentKey] = src;
  return attachmentKey;
}

function main(html) {

  ReactDOM.unmountComponentAtNode(document.getElementById('editor-container'));


  let editorCore = new EditorCore({
    container: null,
    value: html,
    readOnly: false,
    onSubscribeProvider(subscriber) {
      console.log('onSubscribeProvider', subscriber);
      if (subscriber.type === 'citation') {
        setTimeout(function () {
          let key = JSON.stringify(subscriber.data.citation);
          if (citationStore[key]) {
            editorCore.provider.notify(subscriber.id, 'citation', {
              formattedCitation: citationStore[key]
            });
          }
          //
          // setTimeout(()=> {
          //   this.editorCore.updateCitation(subscriber.id, subscriber.data.citation);
          // }, 5000);
        }, 0);
      }
      else if (subscriber.type === 'image') {
        setTimeout(function () {
          if (imageStore[subscriber.data.attachmentKey]) {
            editorCore.provider.notify(subscriber.id, 'image', {
              src: imageStore[subscriber.data.attachmentKey]
            });
          }
        }, 0);
      }
    },
    onUnsubscribeProvider(data) {
    },
    async onImportImages(images) {
      console.log('onImportImages', images)
      for (let image of images) {
        let attachmentKey = await importImage(image.src);
        editorCore.attachImportedImage(image.nodeId, attachmentKey);
      }
    },
    onSyncAttachmentKeys(attachmentKeys) {
      console.log('onSyncAttachmentKeys', attachmentKeys);
    },
    onOpenUrl(url) {
      console.log('onOpenUrl(core)', url);
      window.open(url, '_blank');
    },
    onUpdate(html) {
      console.log('onUpdate', html.length);

      let d = beautify(html, { indent_size: 2, space_in_empty_paren: true });
      document.getElementById('dev').classList.remove('prettyprinted');
      document.getElementById('dev').innerText = d;
      PR.prettyPrint();
    },
    onInsertObject(type, data, pos) {
      console.log('onInsertObject', type, data, pos);
      if (type === 'zotero/item') {
        let ids = data.split(',').map(id => parseInt(id));

        let citations = [];
        for (let id of ids) {
          citations.push(
            {
              citationItems: [
                {
                  uri: 'uri1',
                  backupText: 'item' + id
                }
              ],
              properties: {}
            }
          );
        }

        editorCore.insertCitations(citations, pos);
      }
    },
    onOpenAnnotation(annotation) {
      console.log('onOpenAnnotation', annotation)
      alert('Opening annotation: ' + JSON.stringify(annotation));
    },
    onOpenCitationPopup(id, citation) {
      console.log('onOpenCitationPopup', id, citation);
      alert('Open quick format citation dialog ' + id + ' ' + JSON.stringify(citation));
    },
    onOpenContextMenu: (pos, node, x, y) => {
      console.log('onOpenContextMenu', pos, node, x, y)
    }
  });

  document.body.dir = 'ltr';

  ReactDOM.render(
    <Editor
      showUpdateNotice={true}
      readOnly={false}
      editorCore={editorCore}
    />,
    document.getElementById('editor-container')
  );

  window.editorCore = editorCore;
}

let html1 = `
<h1>Nodes:</h1>
<p><code><img src="https://static01.nyt.com/images/2020/07/30/science/30VIRUS-FUTURE3-jump/merlin_174267405_2f8e4d59-b785-4231-aea5-476014cc6306-jumbo.jpg?quality=90&auto=webp"/><strong>werwerwe</strong><a href="sd">sfwere</a></code></p>
<h1>Heading 1</h1>
<h2>Heading 2</h2>
<h3>Heading 3</h3>
<h4>Heading 4</h4>
<h5>Heading 5</h5>
<h6>Heading 6</h6>
<pre dir="rtl">Preformatted/code block (text formatting is not supported here)
1
2
3

</pre>
<blockquote><p style="">Blockquote (supports any node)</p>
<h1>H</h1>
<ol>
<li><p></p></li>
</ol>
<table>
<tr><td><p></p></td><td><p></p></td></tr>
</table>

</blockquote>
<ul>
    <li><p>List (supports any node)
    <ol>
     <li>One</li>
    <li>Two</li>
    <li>Three</li>
    <li><p>Other</p>
        <ol>
            <li><table><tr><td><p></p></td><td><p></p></td></tr><tr><td><p></p></td><td><p></p></td></tr></table></li>
            <li><p><img src="https://static01.nyt.com/images/2020/07/30/science/30VIRUS-FUTURE3-jump/merlin_174267405_2f8e4d59-b785-4231-aea5-476014cc6306-jumbo.jpg?quality=90&auto=webp"/></p></li>
            <li><blockquote></blockquote></li>
        </ol>
    </li>

</ol>
    </p>

</ul>
<table>
<thead>
<tr>
<th>Th 1</th>
<th>Th 2</th>
<th>Th 3</th>
</tr>
</thead>
<tbody>
<tr>
<td><p>External image inside table: <img src="https://static01.nyt.com/images/2020/07/30/science/30VIRUS-FUTURE3-jump/merlin_174267405_2f8e4d59-b785-4231-aea5-476014cc6306-jumbo.jpg?quality=90&auto=webp"/></p></td>
<td><p>List inside table:</p>
<ul>
<li>Element 1</li>
<li>Element 2</li>
<li>Element 3</li>
</ul></td>
<td>
<p>Table inside table</p>
<table>
<tr>
<td style="background-color: green"></td><td></td>
</tr>
<tr>
<td></td><td></td>
</tr>
</table>
</td>
</tr>
</tbody>
</table>
<p>Horizontal rule:</p>
<hr/>

<p>External image:</p>
<p><img src="https://static01.nyt.com/images/2020/07/30/science/30VIRUS-FUTURE3-jump/merlin_174267405_2f8e4d59-b785-4231-aea5-476014cc6306-jumbo.jpg?quality=90&auto=webp"/> </p>
<p>Internal image:</p>
<p><img data-attachment-key="DDAAFF11"/></p>
<p>Internal image placeholder (while waiting for the load):</p>
<p><img data-natural-width="500" data-natural-height="500" data-attachment-key="DDAAFFXX"/></p>
<p><img data-natural-width="500" data-natural-height="500"/></p>


<h1>Marks:</h1>
<ol>
<li><p><strong>strong</strong></p></li>
<li><p><em>emphasis</em></p></li>
<li><p><u>underline</u></p></li>
<li><p><s>strike</s></p></li>
<li><p>O<sub>2</sub></p></li>
<li><p>X<sup>2</sup></p></li>
<li><p><code>inline</code> code</p></li>
<li><p><span style="color: #FF0000">text</span> color</p></li>
<li><p><span style="background-color: #99CC00">background</span> color</p></li>
<li><p><a href="#heading-test-1">internal</a> and <a href="https://www.zotero.org">external</a> link</p></li>
</ol>
<p> </p>
<h1>Special cases:</h1>
<p><strong>Indent (for heading and paragraph only):</strong></p>
<p style="padding-left: 40px">indent 1</p>
<p style="padding-left: 80px">indent 2</p>
<p style="padding-left: 120px">indent 3</p>
<p style="padding-left: 160px">indent 4</p>
<p style="padding-left: 200px">indent 5</p>
<p></p>
<p></p>
<p></p>
<p><strong>Alignment (for heading and paragraph only):</strong></p>
<p style="text-align: left;padding-left: 0px"><span style="color: rgb(0, 0, 0)"><span style="background-color: rgb(255, 255, 255)">Align left</span></span></p>
<p style="text-align: center">Align center</p>
<p style="text-align: right">Align right</p>
<p style="text-align: justify"><span style="color: rgb(0, 0, 0)"><span style="background-color: rgb(255, 255, 255)">Align justify: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</span></span></p>
<p></p>
<p></p>
<p></p>
<p><strong>Right-to-left (for heading and paragraph only):</strong></p>
<p dir="rtl">Right</p>
<p></p>
<p></p>
<p></p>
<h1>Citations and annotations:</h1>
<p>Internal image with annotation (double-click to open):</p>
<p><img width="100" height="100" data-attachment-key="DDAAFF22" data-annotation="%7B%22uri%22%3A%22http%3A%2F%2Fzotero.org%2Fusers%2F1234567%2Fitems%2F6RCWW44F%22%2C%22position%22%3A%7B%22pageIndex%22%3A2%2C%22rects%22%3A%5B%5B298.2%2C480.2%2C552.6%2C749%5D%5D%7D%7D" data-natural-width="1017" data-natural-height="1075"/>
<span class="citation" data-citation="%7B%22citationItems%22%3A%5B%7B%22uri%22%3A%22http%3A%2F%2Fzotero.org%2Fusers%2F1234567%2Fitems%2F5JM6M9R4%22%2C%22backupText%22%3A%22Hui%20et%20al.%2C%202005%22%2C%22locator%22%3A%221177%22%7D%5D%2C%22properties%22%3A%7B%7D%7D"/></p>
<p></p>
<p>Highlight with annotation (double-click to open):</p>
<p><span class="highlight" data-annotation="%7B%22uri%22%3A%22http%3A%2F%2Fzotero.org%2Fusers%2F1234567%2Fitems%2FNK36R7GU%22%2C%22position%22%3A%7B%22pageIndex%22%3A2%2C%22rects%22%3A%5B%5B45.695%2C466.519%2C284.774%2C474.8%5D%2C%5B33.732%2C456.342%2C284.708%2C464.312%5D%2C%5B33.732%2C445.911%2C284.735%2C453.881%5D%5D%7D%7D">"Treatment effects were reported as risk ratio (RR) with 95% confidence interval (CI) for adverse events or mean difference (MD) with 95% CI for length of intubation and duration of ICU and hospital stay. "</span> <span class="citation" data-citation="%7B%22citationItems%22%3A%5B%7B%22uri%22%3A%22http%3A%2F%2Fzotero.org%2Fusers%2F1234567%2Fitems%2FSW46XL4F%22%2C%22backupText%22%3A%22Liu%20et%20al.%2C%202017%22%2C%22locator%22%3A%22192%22%7D%5D%2C%22properties%22%3A%7B%7D%7D"></span></p>
<p></p>
<p></p>
<p></p>
<p></p>
<p></p>
<p></p>
<h1 id="heading-test-1">Click the internal link above to navigate here</h1>
<p></p>
<p></p>
<p></p>
<p></p>
<p></p>
<p></p>
<p></p>
<p></p>
<p></p>
<blockquote cite="asdfasdf">nkjkj</blockquote>
<asdfasdf>
<p style="background-image:  linear-gradient(rgba(0, 0, 255, 0.5), rgba(255, 255, 0, 0.5)), url('https://mdn.mozillademos.org/files/7693/catfront.png');">dddd</p>
<div style="background-image: asdf;">dddd</div>
</asdfasdf>

  <video width = "500" height = "300" controls>
         <source src = "/html/compileonline.mp4" type = "video/mp4">
         This browser doesn't support video tag.
      </video>

<p>Please press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> to re-render an MDN page.</p>

<p><p>ppp</p></p>

<p>&ltq&gt;: When Dave asks HAL to open the pod bay door, HAL answers: <q cite="https://www.imdb.com/title/tt0062622/quotes/qt0396921">I'm sorry, Dave. I'm afraid I can't do that.</q></p>

<dl>
    <dt>Beast of Bodmin</dt>
    <dd>A large feline inhabiting Bodmin Moor.</dd>

    <dt>Morgawr</dt>
    <dd>A sea serpent.</dd>

    <dt>Owlman</dt>
    <dd>A giant owl-like creature.</dd>
</dl>


`;

main(html1);

// setTimeout(() => {
//
// let html2 = `<p>test</p>`
// main(html2);
//
// }, 3000);
