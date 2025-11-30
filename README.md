# MebukiChannel
- Userscripts for [めぶき☆ちゃんねる](https://mebuki.moe/)

## Mebuki Plus
- [本体ソース](https://github.com/TakeAsh/MebukiChannel/blob/main/MebukiPlus/MebukiPlus.user.js)
  - TamperMonkey用ユーザースクリプト
  - 右の`Raw`ってボタン押すとインストールするかどうか聞かれるのでインストールを選択
  - 本番環境ヨシ！
- [Bookmarklet](https://github.com/TakeAsh/MebukiChannel/blob/main/MebukiPlus/MebukiPlus.bookmarklet.js)
Mebuki Plus スクリプトをスマホで動かす
  1. `Raw`ボタンの隣のボタン`Copy raw file`で内容をコピーする
  1. ページをブックマークしてすかさず編集
  1. URLは一旦全消去してからさっきの内容をペースト
  1. ニックネームを「Mebuki Plus」にする
  1. 名前とフォルダーは何か適当なものを入れる<br><img alt="02" height="400" src="https://raw.githubusercontent.com/TakeAsh/MebukiChannel/refs/heads/main/MebukiPlus/img/Bookmarklet02.jpg">
  1. 保存して準備完了
  1. めぶきちゃんねるのカタログ/スレを表示させる
  1. URLをタップして「Mebuki Plus」を入力
  1. 途中でURLの候補が表示されるのでそれをタップ<br><img alt="03" height="400" src="https://raw.githubusercontent.com/TakeAsh/MebukiChannel/refs/heads/main/MebukiPlus/img/Bookmarklet03.jpg">
  1. 適用完了<br><img alt="04" height="400" src="https://raw.githubusercontent.com/TakeAsh/MebukiChannel/refs/heads/main/MebukiPlus/img/Bookmarklet04.jpg">

### 機能
- 設定<br><img alt="Settings" src="https://raw.githubusercontent.com/TakeAsh/MebukiChannel/refs/heads/main/MebukiPlus/img/Settings.png">
- カタログポップアップ<br><img alt="CatalogPopup" src="https://raw.githubusercontent.com/TakeAsh/MebukiChannel/refs/heads/main/MebukiPlus/img/CatalogPopup.png">
- 絵文字ポップアップ<br><img alt="EmojiPopup" src="https://raw.githubusercontent.com/TakeAsh/MebukiChannel/refs/heads/main/MebukiPlus/img/EmojiPopup.png">
- スレッドサムネイル表示, favicon表示, スレ落ち時刻, レス数表示<br><img alt="ThreadThumbnail" height="200" src="https://raw.githubusercontent.com/TakeAsh/MebukiChannel/refs/heads/main/MebukiPlus/img/ThreadThumbnail.jpg">
- スレタイトルポップアップ<br><img alt="ThreadTitlePopup" height="300" src="https://raw.githubusercontent.com/TakeAsh/MebukiChannel/refs/heads/main/MebukiPlus/img/ThreadTitlePopup.jpg">
- レス選択で引用としてレス欄へコピペ
- ゾロ目ピックアップ<br><img alt="ZoromePuckup" src="https://raw.githubusercontent.com/TakeAsh/MebukiChannel/refs/heads/main/MebukiPlus/img/ZoromePuckup.png">
- ゾロ目必殺技コマンドピックアップ
  - 昇竜拳(623, 421)<br><img alt="ShouryuKen" src="https://raw.githubusercontent.com/TakeAsh/MebukiChannel/refs/heads/main/MebukiPlus/img/ShouryuKen.png">
  - 波動拳(236, 214)<br><img alt="HadouKen" src="https://raw.githubusercontent.com/TakeAsh/MebukiChannel/refs/heads/main/MebukiPlus/img/HadouKen.png">
  - ヨガフレイム(426, 624)<br><img alt="YogaFlame" src="https://raw.githubusercontent.com/TakeAsh/MebukiChannel/refs/heads/main/MebukiPlus/img/YogaFlame.png">
  - スクリューパイルドライバー(4.268, 6.248)<br><img alt="ScrewPileDriver" src="https://raw.githubusercontent.com/TakeAsh/MebukiChannel/refs/heads/main/MebukiPlus/img/ScrewPileDriver.png">
- ダイス補助
  - 選択結果強調表示(範囲指定対応, 複数選択可, 強調色指定可)
  - RGB値可視化
  - おにぎりダブルアップチャンス！！<br>このおにぎりWアップチャンスは出た目の２乗個が貰えます。<br>目が100なら、１万個のおにぎりが貰えます……
  - 例<br><img alt="DiceSupport" src="https://raw.githubusercontent.com/TakeAsh/MebukiChannel/refs/heads/main/MebukiPlus/img/DiceSupport.png">
- カタログピックアップワードのエクスポート, ソート
