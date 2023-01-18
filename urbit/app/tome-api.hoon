::  a space agent skeleton
/-  *tome
/+  r-l=realm-lib
/+  verb, dbug, defa=default-agent
/+  *mip
::
|%
::
+$  versioned-state  $%(state-0)
::
+$  state-0  [%0 tome=(mip space app tome-data)]
::
::
::  boilerplate
::
+$  card  card:agent:gall
--
::
%+  verb  &
%-  agent:dbug
=|  state-0
=*  state  -
::
^-  agent:gall
::
=<
  |_  =bowl:gall
  +*  this  .
      def  ~(. (defa this %|) bowl)
      eng   ~(. +> [bowl ~])
  ++  on-init
    ^-  (quip card _this)
    ~>  %bout.[0 '%tome-api +on-init']
    =^  cards  state
      abet:init:eng
    [cards this]
  ::
  ++  on-save
    ^-  vase
    ~>  %bout.[0 '%tome-api +on-save']
    !>(state)
  ::
  ++  on-load
    |=  ole=vase
    ~>  %bout.[0 '%tome-api +on-load']
    ^-  (quip card _this)
    =^  cards  state
      abet:(load:eng ole)
    [cards this]
  ::
  ++  on-poke
    |=  cag=cage
    ~>  %bout.[0 '%tome-api +on-poke']
    ^-  (quip card _this)
    =^  cards  state  abet:(poke:eng cag)
    [cards this]
  ::
  ++  on-peek
    |=  =path
    ~>  %bout.[0 '%tome-api +on-peek']
    ^-  (unit (unit cage))
    [~ ~]
  ::
  ++  on-agent
    |=  [wir=wire sig=sign:agent:gall]
    ~>  %bout.[0 '%tome-api +on-agent']
    ^-  (quip card _this)
    `this
  ::
  ++  on-arvo
    |=  [wir=wire sig=sign-arvo]
    ~>  %bout.[0 '%tome-api +on-arvo']
    ^-  (quip card _this)
    `this
  ::
  ++  on-watch
  |=  =path
  ~>  %bout.[0 '%tome-api +on-watch']
  ^-  (quip card _this)
  =^  cards  state  abet:(peer:eng path)
  [cards this]
  ::
  ++  on-fail
    ~>  %bout.[0 '%tome-api +on-fail']
    on-fail:def
  ::
  ++  on-leave
    ~>  %bout.[0 '%tome-api +on-leave']
    on-leave:def
  --
|_  [bol=bowl:gall dek=(list card)]
+*  dat  .
++  emit  |=(=card dat(dek [card dek]))
++  emil  |=(lac=(list card) dat(dek (welp lac dek)))
++  abet
  ^-  (quip card _state)
  [(flop dek) state]
::
++  init
  ^+  dat
  dat
::
++  load
  |=  vaz=vase
  ^+  dat
  ?>  ?=([%0 *] q.vaz)
  dat(state !<(state-0 vaz))
::  +peer: handle on-watch
::
++  peer
  |=  pol=(pole knot)
  ^+  dat
  ?+    pol  ~|(bad-watch-path/pol !!)
      [%kv space=@ app=@ bucket=@ rest=*]
    =^  cards  state
      kv-abet:(kv-peer:(kv-abed:kv [space.pol app.pol bucket.pol]) rest.pol)
    (emil cards)
  ==
++  poke
  |=  [mar=mark vaz=vase]
  =^  cards  state
    ?+  mar  ~|(bad-tome-mark/mar !!)
        %tome-action
      =/  act  !<(tome-action vaz)
      ?-  -.act
          %init-tome
        ?.  =(our.bol src.bol)  ~|('no-foreign-init-tome' !!)
        ?:  (~(has bi tome) space.act app.act)
          `state
        `state(tome (~(put bi tome) space.act app.act *tome-data))
          %init-kv
        :: todo should I do this in the nested core?
        ?.  =(our.bol src.bol)  ~|('no-foreign-init-kv' !!)
        =+  td=(~(got bi tome) space.act app.act)
        ?:  (~(has by store.td) bucket.act)
          `state
        =.  store.td  (~(put by store.td) bucket.act [perm.act *invited *invited *kv-meta *kv-data])
        `state(tome (~(put bi tome) space.act app.act td))
      ==
        %kv-action
      =/  act  !<(kv-action vaz)
      =*  do  kv-abet:(kv-poke:(kv-abed:kv [space.act app.act bucket.act]) act)
      ?-  -.act
          %set-value
        do
          %remove-value
        do
          %clear-kv
        do
      ==
    ==
  (emil cards)
::
::  +kv: keyvalue engine
::
++  kv
  |_  $:  s=space
          a=app
          b=bucket
          td=tome-data
          per=perm
          whi=invited
          bla=invited
          meta=kv-meta
          data=kv-data
          caz=(list card)
      ==
  +*  kv  .
  ++  kv-emit  |=(c=card kv(caz [c caz]))
  ++  kv-emil  |=(lc=(list card) kv(caz (welp lc caz)))
  ++  kv-abet
    ^-  (quip card _state)
    =.  store.td  (~(put by store.td) b [per whi bla meta data])
    [(flop caz) state(tome (~(put bi tome) s a td))]
  ::
  ++  kv-abed
    |=  [s=space a=app b=bucket]
    =+  td=(~(got bi tome) s a)
    =+  st=(~(got by store.td) b)
    %=  kv
      s     s
      a     a
      b     b
      td    td
      per   perm.st
      whi   whitelist.st
      bla   blacklist.st
      meta  meta.st
      data  data.st
    ==
  ::  +kv-perm: check permissions, return true if allowed
  ::
  ++  kv-perm
    |=  [act=?(%read %create %overwrite)]
    ^-  ?
    ?-  act
        %read
      ?:  (~(has in read.whi) src.bol)  %.y
      ?:  (~(has in read.bla) src.bol)  %.n
      ?-  read.per
          %our
        =(our.bol src.bol)
          %team
        (team:title our.bol src.bol)
          %space
        :: TODO check if in the space
        %.y
          %open
        %.y
      ==
        %create
      ?:  (~(has in write.whi) src.bol)  %.y
      ?:  (~(has in write.bla) src.bol)  %.n
      ?-  write.per
          %our
        =(our.bol src.bol)
          %team
        (team:title our.bol src.bol)
          %space
        :: TODO check if in the space
        %.y
          %open
        %.y
      ==
        %overwrite
      ?:  (~(has in admin.whi) src.bol)  %.y
      ?:  (~(has in admin.bla) src.bol)  %.n
      ?-  admin.per
          %our
        =(our.bol src.bol)
          %team
        (team:title our.bol src.bol)
          %space
        :: TODO check if in the space
        %.y
          %open
        %.y
      ==
    ==
  ::
  ++  kv-peer
    |=  rest=(pole knot)
    ^+  kv
    ?+    rest  ~|(bad-kv-watch-path/rest !!)
      ::   [%perm ~]
      ::   ~[[key.act s+value.act]]
      :: %-  kv-emit
      :: [%give %fact ~ %perm-update ...]
        [%data %all ~]
      %-  kv-emit
      [%give %fact ~ %kv-update !>(`kv-update`[%all data])]
        [%data %key k=@t ~]
      %-  kv-emit
      [%give %fact ~ %kv-update !>(`kv-update`[%get (~(gut by data) k.rest ~)])]
    ==
  ++  kv-poke
    |=  act=kv-action
    ^+  kv
    ::  right now live updates only go to the subscribeAll endpoint
    =/  pas  ~[/kv/[s]/[a]/[b]/data/all]
    ?-  -.act
        %set-value
      ::  equivalent value is already set, do nothing.
      ?:  =(s+value.act (~(gut by data) key.act ~))  kv
      =+  cm=(~(gut by meta) key.act ~)
      =/  lvl
        ?~  cm
          %create
        ?:(=(src.bol created-by.cm) %create %overwrite)
      ?>  (kv-perm lvl)
      ::
      =/  nm
        ?~  cm
          ::  this value is new, so create new metadata entry alongside it
          [src.bol src.bol now.bol now.bol]
        ::  this value already exists, so update its metadata
        [created-by.cm src.bol created-at.cm now.bol]
      ::
      %=  kv
        meta  (~(put by meta) key.act nm)
        data  (~(put by data) key.act s+value.act)
        caz   [[%give %fact pas %kv-update !>(`kv-update`[%set key.act value.act])] caz]
      ==
      ::
        %remove-value
      =+  cm=(~(gut by meta) key.act ~)
      ?~  cm
        kv
      =/  lvl  ?:(=(src.bol created-by.cm) %create %overwrite)
      ?>  (kv-perm lvl)
      ::
      %=  kv
        meta  (~(del by meta) key.act)
        data  (~(del by data) key.act)
        caz   [[%give %fact pas %kv-update !>(`kv-update`[%remove key.act])] caz]
      ==
      ::
        %clear-kv
      :: TODO check if kv is already empty for no-op
      ::
      ::  could check if all values are ours for %create perm level, but that's overkill
      ?>  (kv-perm %overwrite)
      %=  kv
        meta  *kv-meta
        data  *kv-data
        caz   [[%give %fact pas %kv-update !>(`kv-update`[%clear ~])] caz]
      ==
    ==
  --
--