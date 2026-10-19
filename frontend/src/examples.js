export const oldSpec = JSON.stringify({ endpoints:[
  { method:'GET',path:'/v1/accounts/{id}',request_required:['id'],response_required:['id','balance'],behavior:'Returns balance in integer cents for an existing account.'},
  { method:'POST',path:'/v1/transfers',request_required:['amount','recipient'],response_required:['transfer_id','status'],behavior:'Transfers are idempotent when the caller provides the same client reference.'}
]},null,2);
export const newSpec = JSON.stringify({ endpoints:[
  { method:'GET',path:'/v1/accounts/{id}',request_required:['id'],response_required:['id','balance'],behavior:'Returns balance in integer cents for an existing account; zero balances are returned as zero.'},
  { method:'POST',path:'/v1/transfers',request_required:['amount','recipient'],response_required:['transfer_id','status'],behavior:'Transfer retry requests with the same client reference may create a second transfer.'}
]},null,2);
